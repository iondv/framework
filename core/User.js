/**
 * Created by krasilneg on 07.06.17.
 */

function User(data, coactors, tz) {
  let ca = coactors || {};

  let timezone = tz;

  this.id = function() {
    return data.id + (data.type ? `@${data.type}` : '');
  };

  this.login = function () {
    return data.id;
  };

  this.name = function () {
    return data.name || this.id();
  };

  this.type = function() {
    return data.type;
  };

  this.email = function() {
    return (data.properties && data.properties.email) || data.email;
  };

  this.pwdDate = function() {
    return data.pwdDate;
  };

  this.pwdHash = function() {
    return data.pwd;
  };

  this.needPwdReset = function() {
    return data.needPwdReset;
  };

  this.toString = function() {
    return this.name();
  };

  this.properties = function() {
    return data.properties || {};
  };

  this.setTz = function(tz) {
    timezone = tz;
  };

  this.setCoactors = function(ca2) {
    ca = Object.assign(ca, ca2);
  };

  this.setProperties = function(properties) {
    data.properties = Object.assign(data.properties || {}, properties);
  };

  this.isMe = function(sid) {
    return this.id() === sid || ca.hasOwnProperty(sid) && ca[sid];
  };

  this.addCoactor = function(id) {
    ca[id] = true;
  };

  this.coactors = function() {
    return Object.keys(ca);
  };

  this.timeZone = function() {
    return timezone;
  };

  this.isDisabled = function() {
    return data.disabled;
  };

  this.language = function() {
    return data.language;
  };
}

module.exports = User;
