const Framework = require('nexia_framework');
const Stream = require('reports/common/stream');

class StreamModel extends Framework.Model {}

// TODO: why isn't this working? `_.extend(StreamCollection.prototype, Stream.prototype);`
// Using the work around below
Stream.prototype.extendOnTo(StreamModel.prototype);

module.exports = StreamModel;
