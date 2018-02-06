'use strict';
/**
 * Created by krasilneg on 07.06.17.
 */

function User(data, coactors, tz) {
  var ca = coactors || {};

  var timezone = tz;

  this.id = function () {
    return data.id + (data.type ? '@' + data.type : '');
  };

  this.name = function () {
    return data.name || this.id();
  };

  this.email = function () {
    return (data.properties && data.properties.email) || data.email;
  };

  this.toString = function () {
    return this.name();
  };

  this.properties = function () {
    return data.properties || {};
  };

  this.setTz = function (tz) {
    timezone = tz;
  };

  this.setCoactors = function (ca2) {
    ca = Object.assign(ca, ca2);
  }

  this.setProperties = function (properties) {
    data.properties = Object.assign(data.properties || {}, properties);
  };

  this.isMe = function (sid) {
    return this.id() === sid || ca.hasOwnProperty(sid) && ca[sid];
  };

  this.addCoactor = function (id) {
    ca[id] = true;
  };

  this.coactors = function () {
    return Object.keys(ca);
  };

  this.timeZone = function () {
    return timezone;
  };
}

module.exports = User;
