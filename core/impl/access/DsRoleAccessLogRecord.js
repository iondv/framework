
const logRecord = require('core/impl/changelogger/DsChangeLogger2').logRecord;

class Record extends logRecord {

  normalize() {
    const result = {
      timestamp: this.base.timestamp || new Date(),
      type: this.base.type,
      before: this.base.before,
      updates: this.base.updates
    };
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
      UNDEFINE_ROLES: "UNDEFINE_ROLE",
      DEFINE_ROLE: "DEFINE_ROLE"
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