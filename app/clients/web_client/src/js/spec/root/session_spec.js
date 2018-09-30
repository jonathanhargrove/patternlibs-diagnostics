define(function (require) {
  require('spec/spec_helper');
  const Session = require('root/models/session');

  describe('Session', function () {
    describe('after the model is saved to the server', function () {
      it('resets dirty states', function () {
        const session = new Session();
        session.set('newFeatureCodes', ['foo']);
        session.set('removedFeatureCodes', ['bar']);

        session.trigger('sync');

        expect(session.get('newFeatureCodes')).toEqual([]);
        expect(session.get('removedFeatureCodes')).toEqual([]);
      });
    });

    describe('#isAdmin', function () {
      describe("for a user with the 'admin' role", function () {
        beforeEach(function () {
          this.session = new Session({roles: ['admin']});
        });

        it('is true', function () {
          expect(this.session.isAdmin()).toBe(true);
        });
      });

      describe("for a user without the 'admin' role", function () {
        beforeEach(function () {
          this.session = new Session({roles: ['dealer', 'fsr']});
        });

        it('is false', function () {
          expect(this.session.isAdmin()).toBe(false);
        });
      });

      describe('for a blank session', function () {
        beforeEach(function () {
          this.session = new Session();
        });

        it('is false', function () {
          expect(this.session.isAdmin()).toBe(false);
        });
      });
    });

    describe('#isFsr', function () {
      describe("for a user with the 'fsr' role", function () {
        beforeEach(function () {
          this.session = new Session({roles: ['fsr']});
        });

        it('is true', function () {
          expect(this.session.isFsr()).toBe(true);
        });
      });

      describe("for a user without the 'fsr' role", function () {
        beforeEach(function () {
          this.session = new Session({roles: ['dealer', 'admin']});
        });

        it('is true', function () {
          expect(this.session.isFsr()).toBe(false);
        });
      });

      describe('for a blank session', function () {
        beforeEach(function () {
          this.session = new Session();
        });

        it('is false', function () {
          expect(this.session.isFsr()).toBe(false);
        });
      });
    });

    describe('#shouldShowAdminNav()', () =>
      describe('for an admin user', function () {
        beforeEach(function () {
          this.roles = ['admin'];
        });

        describe('that is impersonating a dealer', function () {
          beforeEach(function () {
            this.isImpersonating = true;

            this.session = new Session({roles: this.roles, 'impersonating?': this.isImpersonating});
          });

          it('is false', function () {
            expect(this.session.shouldShowAdminNav()).toBe(false);
          });
        });

        describe('that is NOT impersonating a dealer', function () {
          beforeEach(function () {
            this.isImpersonating = false;

            this.session = new Session({roles: this.roles, 'impersonating?': this.isImpersonating});
          });

          it('is true', function () {
            expect(this.session.shouldShowAdminNav()).toBe(true);
          });
        });
      })
    );

    describe('#featureEnabled', function () {
      beforeEach(function () {
        this.session = new Session({roles: ['whatever']});
      });

      describe('for an undefined feature', () =>
        it('is false', function () {
          expect(this.session.featureEnabled(true)).toBe(false);
        })
      );

      describe('for an admin', function () {
        beforeEach(function () {
          this.session = new Session({roles: ['admin']});
        });

        it('is always true', function () {
          expect(this.session.featureEnabled('somethingcompletelyrandom')).toBe(true);
        });
      });

      describe('for an fsr', function () {
        beforeEach(function () {
          this.session = new Session({roles: ['fsr']});
        });

        it('is always true', function () {
          expect(this.session.featureEnabled('somethingcompletelyrandom')).toBe(true);
        });
      });

      describe('for a dealer (and anyone else)', function () {
        beforeEach(function () {
          this.enabledFeature = 'ndm';
          this.session = new Session({roles: ['dealer'], enabledFeatures: [this.enabledFeature]});
        });

        describe('if the feature is enabled', () =>
          it('is true', function () {
            expect(this.session.featureEnabled(this.enabledFeature)).toBe(true);
          })
        );

        describe('if the feature is NOT enabled', () =>
          it('is false', function () {
            expect(this.session.featureEnabled('thisIsNOTEnabled')).toBe(false);
          })
        );
      });
    });

    describe('#addFeatureCode', function () {
      beforeEach(function () {
        this.session = new Session();
      });

      it('adds the code to the newFeatureCodes list', function () {
        this.session.addFeatureCode('potato');
        this.session.addFeatureCode('orange');

        expect(this.session.get('newFeatureCodes')).toContain('potato');
        expect(this.session.get('newFeatureCodes')).toContain('orange');
      });
    });

    describe('#removeFeatureCode', function () {
      beforeEach(function () {
        this.session = new Session({
          newFeatureCodes: ['potato', 'carrot'],
          enabledFeatures: ['orange', 'carrot']
        });
      });

      describe('for a feature only in the newFeatureCodes list', function () {
        beforeEach(function () {
          this.session.removeFeatureCode('potato');
        });

        it('removes the code from the newFeatureCodes list', function () {
          expect(this.session.get('newFeatureCodes')).not.toContain('potato');
          expect(this.session.get('newFeatureCodes')).toContain('carrot');
        });
      });

      describe('for a feature in the enabledFeatures list', function () {
        beforeEach(function () {
          this.session.removeFeatureCode('orange');
        });

        it('removes the code from the enabledFeatures list', function () {
          expect(this.session.get('enabledFeatures')).not.toContain('orange');
          expect(this.session.get('enabledFeatures')).toContain('carrot');
        });

        it('adds the feature to the removedFeatureCodes list', function () {
          expect(this.session.get('removedFeatureCodes')).toContain('orange');
        });
      });
    });

    describe('#dealerCode', function () {
      it('returns the normalized dealer code if phone number is present', function () {
        const session = new Session({dealerPhoneNumber: '(888) 888-8888'});
        expect(session.dealerCode()).toEqual('8888888888');
      });

      it('returns an empty string if phone number is not present', function () {
        const session = new Session();
        expect(session.dealerCode()).toEqual('');
      });
    });
  });
});
