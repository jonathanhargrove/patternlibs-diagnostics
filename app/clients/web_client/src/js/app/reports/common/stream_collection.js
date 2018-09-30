const Framework = require('nexia_framework');
const Stream = require('reports/common/stream');

class StreamCollection extends Framework.Collection {}

// TODO: why isn't this working? `_.extend(StreamCollection.prototype, Stream.prototype);`
// Using the work around below
Stream.prototype.extendOnTo(StreamCollection.prototype);

module.exports = StreamCollection;
