When(/^I enter the AUID to view current status$/) do
  subscribe_to_current_status_on_xxl
end

def subscribe_to_current_status_on_xxl
  get "/current_status/#{@auid}"
  last_response.body.should match(/stream_id .*? subscribed to current_status for #{@auid}/)
  last_response.status.should == 200
end
