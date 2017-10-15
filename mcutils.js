var Ber = require('asn1').Ber;

exports.uuid = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + s4() + s4() + s4();
}

exports.readX509PublicKey = function(key) {
  var reader = new Ber.Reader(new Buffer(key, "base64"));
  reader.readSequence();
  reader.readSequence();
  reader.readOID();
  reader.readOID();
  return new Buffer(reader.readString(Ber.BitString, true)).slice(1);
}

exports.writeX509PublicKey = function(key) {
  var writer = new Ber.Writer();
  writer.startSequence();
  writer.startSequence();
  writer.writeOID("1.2.840.10045.2.1");
  writer.writeOID("1.3.132.0.34");
  writer.endSequence();
  writer.writeBuffer(Buffer.concat([new Buffer([0x00]),key]),Ber.BitString);
  writer.endSequence();
  return writer.buffer.toString("base64");
}

