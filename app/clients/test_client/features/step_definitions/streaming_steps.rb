Given(/^I am subscribed to receive a stream of alarms$/) do
  pending
  # @auid = "1010AAAA"
  # @stream_thread = subscribe_to_alarms(@auid, :trickle_event_streams)
  # @stream_thread.join
  # Thread.main[:trickle_event_streams].join("-").should match("retry")
end

When(/^The XL950 publishes a list of alarms$/) do
  pending
  # XxlSimulator::ApiReactor.start({auid: @auid, port: 8090, suppress_output: true})
end

Then(/^I can view a the list of current alarms for that system without refreshing the page$/) do
  pending
end
