const EditSiteMessageView = require('site_messages/views/edit_site_message_view');
const SiteMessage = require('site_messages/models/site_message');

describe('EditSiteMessageView', function () {
  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();

    this.model = new SiteMessage({ title: 'title', siteBannerEnabled: true, updatedAt: 1, messageType: 'warning' });
    this.view = new EditSiteMessageView({ model: this.model }).render();
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('#render', function () {
    it('sets the radio option selection for the message type', function () {
      const warningChecked = this.view.$el.find('input[name="messageType"][value="warning"]').prop('checked');

      expect(warningChecked).toBeTruthy();
    });
  });

  describe('when saving a site message', function () {
    it('saves the model', function () {
      const saveStub = this.sandbox.stub(this.model, 'save');

      this.view.$el.find('#submit').click();

      expect(saveStub.called).toBeTruthy();
    });

    describe('and save succeeds', function () {
      beforeEach(function () {
        this.modelSaveSpy = this.sandbox.spy(this.view.model, 'save');
      });

      it('calls save succeeded on the form helper', function () {
        const saveSucceededStub = sinon.stub(this.view.formHelper, 'saveSucceeded');

        this.view.$el.find('#submit').click();

        this.modelSaveSpy.getCall(0).args[1].success();

        expect(saveSucceededStub.called).toBeTruthy();
      });
    });

    describe('and save fails', function () {
      beforeEach(function () {
        this.modelSaveSpy = this.sandbox.spy(this.view.model, 'save');
      });

      it('calls save failed on the form helper', function () {
        const saveFailedStub = sinon.stub(this.view.formHelper, 'saveFailed');

        this.view.$el.find('#submit').click();

        this.modelSaveSpy.getCall(0).args[1].error(null, 'fake response');

        expect(saveFailedStub.calledWith('fake response')).toBeTruthy();
      });
    });
  });

  describe('when selecting an image', function () {
    beforeEach(function () {
      const readAsDataUrlSpy = sinon.spy();
      const reader = {
        readAsDataURL: readAsDataUrlSpy,
        result: 'fake image data url'
      };
      this.sandbox.stub(window, 'FileReader').returns(reader);

      this.view.$('#image-file').change();

      reader.onload();
    });

    it('sets the image on the model', function () {
      expect(this.model.get('image')).toBe('fake image data url');
    });

    it('hides the image file selector', function () {
      expect(this.view.$('#image-file').length).toBeFalsy();
    });

    it('shows the image', function () {
      expect(this.view.$('#image').attr('src')).toBe('fake image data url');
    });

    it('shows the remove image action', function () {
      expect(this.view.$('#remove-image').length).toBeTruthy();
    });

    it('shows the image', function () {
      expect(this.view.$('#image').length).toBeTruthy();
    });
  });

  describe('when removing an image', function () {
    beforeEach(function () {
      this.model.set('image', 'fake image data url');

      this.view.render();

      this.view.$('#remove-image').click();
    });

    it('removes the image from the model', function () {
      expect(this.model.get('image')).toBeNull();
    });

    it('shows the image file selector', function () {
      expect(this.view.$('#image-file').length).toBeTruthy();
    });

    it('hides the remove image action', function () {
      expect(this.view.$('#remove-image').length).toBeFalsy();
    });

    it('hides the image', function () {
      expect(this.view.$('#image').length).toBeFalsy();
    });
  });

  describe('when cancelling', function () {
    it('calls confirm cancel on the form helper', function () {
      const confirmCancelStub = sinon.stub(this.view.formHelper, 'confirmCancel');

      this.view.$el.find('#cancel').click();

      expect(confirmCancelStub.called).toBeTruthy();
    });
  });

  describe('when deleting', function () {
    it('calls confirm delete on the form helper', function () {
      this.view = new EditSiteMessageView({ model: new SiteMessage({ id: 1 }) }).render();

      const confirmDeleteStub = sinon.stub(this.view.formHelper, 'confirmDelete');

      this.view.$el.find('#delete').click();

      expect(confirmDeleteStub.called).toBeTruthy();
      expect(confirmDeleteStub.calledWith($(this.view.$el.find('#delete')[0]))).toBeTruthy();
    });
  });
});
