
const logRecord = require('core/impl/changelogger/DsChangeLogger2').logRecord;

class Record extends logRecord {

  normalize() {
    return {
      timestamp: new Date(),
      type: this.base.type,
      authorId: this.base.authorId || this.base.author.id(),
      authorName: this.base.authorName || this.base.author.name(),
      authorIp: this.base.authorIp || this.base.author.properties().ip,
      ???subjectId: this.subject.id(),
      ???subjectName: this.subject.name(),
      before: this.base.base,
      updates: this.base.updates
    }
  }

  static types() {
    return {
      ASSIGN_ROLES: "ASSIGN_ROLES",
      UNASSIGN_ROLES: "UNASSIGN_ROLES",
      GRANT: "GRANT",
      DENY: "DENY",
      _undefineRoles
      _defineRole
    };
  }

  static getFilter(???) {
    const and = [];
    if (???.???) {
      and.push({[F.EQUAL]: ['$???', ???.???]});
    }
    return {[F.AND]: and};
  }
}


module.exports = Record;