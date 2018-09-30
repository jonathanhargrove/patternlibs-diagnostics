const Framework = require('nexia_framework');

describe('Framework.Collection', () => {
  let a, b, c, subject;
  beforeEach(() => {
    a = new Framework.Model({name: 'a'});
    b = new Framework.Model({name: 'b'});
    c = new Framework.Model({name: 'c'});

    subject = new Framework.Collection([b, a, c]);
  });

  describe('#setSortAttribute', () => {
    it('sets a comparator for the attribute', () => {
      subject.setSortAttribute('name').sort();
      expect(subject.models).toEqual([a, b, c]);
    });

    it('sets a sort direction when called twice with the same attribute and switchDirection', () => {
      subject.setSortAttribute('name', {switchDirection: true}).sort();
      expect(subject.models).toEqual([a, b, c]);

      subject.setSortAttribute('name', {switchDirection: true}).sort();
      expect(subject.models).toEqual([c, b, a]);
    });
  });
});
