require_relative "../../../shared/spec/factories"

module FeatureHelper
  def snake_case_hash_keys(items)
    if items.is_a?(Hash)
      new_hash = {}
      items.each do |key, value|
        new_hash[key.to_s.snake_case.to_sym] = value
      end

      return new_hash
    elsif items.is_a?(Array)
      items.map { |item| snake_case_hash_keys(item) }
    else
      raise "Can only snake_case arrays of hashes or hashes"
    end
  end
end
World(FeatureHelper)

module DealerHelper
  def dealer_uuid
    @dealer_uuid ||= "BOB-THE-FAKE-DEALER-GUID"
  end
end
World(DealerHelper)

module NexiaAuthHelper
  def login
    post "/api/sessions", {
      username: "SingleSignOn",
      password: "012094f5ad65c9f948b353c4bc3d82c42220cd5055f40b99d40a284314cc1de9"
    }
    expect(last_response.status).not_to eq(401)
    expect(last_response.status).not_to eq(403)
    expect(last_response.status).not_to eq(500)
  end

  def login_via_single_sign_on
    get_single_sign_on_session(get_single_sign_on_link)
  end

  def get_single_sign_on_link(nonce_request = nil)
    nonce_request_builder = NexiaMessages::Auth::Test::NonceRequestBuilder.new
    nonce_request_builder.single_sign_on_username = "SingleSignOn"
    nonce_request_builder.single_sign_on_password = "012094f5ad65c9f948b353c4bc3d82c42220cd5055f40b99d40a284314cc1de9"
    nonce_request_builder.timestamp = Time.now
    nonce_request_builder.foreign_user_id = "BobTheDealersId4"
    nonce_request_builder.dealer_guid = dealer_uuid

    nonce_request ||= nonce_request_builder.build
    post "/api/single-sign-on-link", { "body" => nonce_request.encrypt }
    expect(last_response.status).to eq(201)
    encrypted_nonce_response = JSON.parse(last_response.body)["body"]
    NexiaMessages::Auth::NonceResponse.decrypt(encrypted_nonce_response)
  end

  def get_single_sign_on_session(nonce_response, roles = nil)
    timestamp = nonce_response.timestamp
    nonce = nonce_response.nonce
    dealer_user_id = nonce_response.foreign_user_id
    dealer_guid = nonce_response.dealer_guid
    roles = JSON.generate(roles || [{ "name" => "Nexia.Dealer" }])
    token_numeric = "012094f5ad65c9f948b353c4bc3d82c42220cd5055f40b99d40a284314cc1de9"
    body = %(SingleSignOn::#{token_numeric}::#{timestamp}::#{nonce}::#{dealer_user_id}::#{dealer_guid}::Bob Vila::#{roles})
    body = NexiaMessages::Auth::AccessToken.parse(body.strip).encrypt
    post "/api/sessions", "body=#{URI.encode_www_form_component(body)}", { "Content-Type" => "application/x-www-form-urlencoded" }
    expect(last_response.status).not_to eq(401)
    expect(last_response.status).not_to eq(403)
    expect(last_response.status).not_to eq(500)
    last_response
  end
end
World(NexiaAuthHelper)

module CustomerHelper
  def add_customer(customer)
    Persistence.database[:customers].insert(customer)
  end

  def customers
    Persistence.database[:customers].all
  end
end
World(CustomerHelper)

module DeviceHelper
  def add_device(device)
    create(:device, device)
  end

  def devices
    Persistence.database[:devices].where(device_type: "thermostat").all
  end

  def device_ids
    @device_ids ||= devices.map { |device| device[:device_id] }
  end

  def sanitize_device(device)
    device.delete("id")
    device
  end

  def sanitize_devices(devices)
    devices.each { |device| sanitize_device(device) }
    devices
  end
end
World(DeviceHelper)

module NexiaHomeDeviceHelper
  def nexia_home_attributes(status = "NOT ENROLLED IN A NEXIA HOME ACCOUNT")
    { "deviceModel" => "XL950", "status" => status }
  end

  def merge_nexia_home_attributes(device, status = "NOT ENROLLED IN A NEXIA HOME ACCOUNT")
    nexia_home_attributes(status).merge(device)
  end

  def test_connection_to_nexia_home
    puts "trying to connect to nexia home..."
    expect(NexiaHome::ProvisionDeviceInNexiaHome.new.notify(dealer_uuid, "A987654A")).to eq(200)
  end
end
World(NexiaHomeDeviceHelper)
