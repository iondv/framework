/**
 * Created by krasilneg on 07.06.17.
 */

function User(data, coactors) {
  var ca = coactors || {};

  this.id = function () {
    return data.id + (data.type ? '@' + data.type : '');
  };

  this.name = function () {
    return data.name || this.id();
  };

  this.toString = function () {
    return this.name();
  };

  this.properties = function () {
    return data.properties || {};
  };

  this.isMe = function (sid) {
    return this.id() === sid || ca.hasOwnProperty(sid) && ca[sid];
  };

  this.addCoactor = function (id) {
    ca[id] = true;
  };
}

module.exports = User;
