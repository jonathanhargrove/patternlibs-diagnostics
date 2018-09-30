require "rspec"
require "json_spec"
require "xxl_simulator"
require "net/http"
require "open-uri"
require "pry"
require "faraday"
require "faraday-cookie_jar"
require "faraday_middleware"
require "mocha/setup"
require "bundler"

$stdout.sync = true

Dir[File.expand_path(File.join("..", "..", "..", "lib", "**", "*.rb"), __FILE__)].sort.each { |f| require f }
include Testr

require File.expand_path(File.join("..", "..", "..", "..", "..", "initializer.rb"), __FILE__)
NexiaDealer::Initializer.load_all_projects

Bundler.require(:default, :test)

begin
  DatabaseCleaner[:sequel, { connection: Persistence.database }].strategy = :truncation
rescue raise
  NameError "You need to add database_cleaner to your Gemfile (in the :test group) if you wish to use it."
end

Before do
  DatabaseCleaner.start
  DatabaseCleaner.clean
  Persistence.database[:dealers].insert(uuid: dealer_uuid)
end

After do
  DatabaseCleaner.clean
end

attr_reader :last_response

def nexia_dealer_url
  env = ENV["RACK_ENV"]
  url = if env == NexiaDealer::Environment::QA
          "https://qa-diagnostics.mynexia.com"
        elsif env    == NexiaDealer::Environment::STAGING
          "https://staging-diagnostics.mynexia.com"
        else
          "http://localhost:3001"
        end
  URI.parse url
end

def app
  if @app
    @app
  else
    @app = Faraday.new(url: nexia_dealer_url.to_s) do |faraday|
      faraday.use :cookie_jar
      faraday.use FaradayMiddleware::FollowRedirects
      faraday.adapter Faraday.default_adapter  # make requests with Net::HTTP
    end
  end
end

def get(url, headers = {})
  @last_response = app.get do |req|
    req.url url
    headers.each_pair { |key, value| req.headers[key] = value }
  end
end

def post(url, body, headers = {})
  headers["Content-Type"] ||= "application/json"

  @last_response = app.post do |req|
    req.url url
    headers.each_pair { |key, value| req.headers[key] = value }
    req.body = if headers["Content-Type"] == "application/json"
                 JSON.generate(body)
               else
                 body
               end
  end
end

def patch(url, body, headers = {})
  headers["Content-Type"] ||= "application/json"

  @last_response = app.patch do |req|
    req.url url
    headers.each_pair { |key, value| req.headers[key] = value }
    req.body = JSON.generate(body)
  end
end

def put(*args)
  @last_response = app.put(*args)
end

def delete(*args)
  @last_response = app.delete(*args)
end

def stream_id
  @stream_id = "DEADBEAF"
end

def subscribe_to_alarms(device_id, stream_result_name)
  Thread.main[stream_result_name] ||= []
  get_stream_async "/stream", 15 do |chunk|
    if Thread.main[stream_result_name].empty?
      body = open("#{nexia_dealer_url}/stream/alarms/#{device_id}", "Cookie" => "stream_id=#{stream_id};").read
      body.should match(/subscribed to alarms for #{device_id}/)
    end
    Thread.main[stream_result_name] << chunk unless chunk == ":\n"
  end
end

def start_stream(stream_result_name)
  Thread.main[stream_result_name] ||= []
  get_stream_async "/stream", 15 do |chunk|
    Thread.main[stream_result_name] << chunk
  end
end

private

def get_stream_async(url, timeout, &block)
  @stream_thread = Thread.new do
    get_stream(url, timeout, &block)
  end
end

def get_stream(url, timeout, &block)
  Timeout.timeout(timeout) do
    Net::HTTP.start nexia_dealer_url.host, nexia_dealer_url.port do |http|
      request = Net::HTTP::Get.new(url, { "Cookie" => "stream_id=#{stream_id};" })
      http.request request do |response|
        response.read_body(&block)
      end
    end
  end
end
