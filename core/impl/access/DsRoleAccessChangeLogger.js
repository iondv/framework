const ChangeLogger = require('core/impl/changelogger/DsChangeLogger2');
const User = require('core/User');
const F = require('core/FunctionCodes');

const RoleAccessChangeLoggerRecordTypes = {
  ASSIGN_ROLE: 'ASSIGN_ROLE',
  GRANT: 'GRANT',
  DENY: 'DENY',
  UNASSIGN_ROLE: 'UNASSIGN_ROLE',
  UNDEFINE_ROLE: 'UNDEFINE_ROLE',
  DEFINE_ROLE: 'DEFINE_ROLE'
};

/**
 * @param {table: String, DataSource: dataSource} options
 */
function dsRoleAccessChangeLogger(options) {

  this.types = () => RoleAccessChangeLoggerRecordTypes;

  this.normalize = (datas) => {
    if (!(datas.author instanceof User))
      throw new Error('Author not specified!');
    const result = {
      authorId: datas.author.id(),
      authorName: datas.author.name(),
      authorIp: datas.author.properties().ip,
      before: datas.before,
      updates: datas.updates
    };
    if (datas.user) {
      result.userId = datas.user.id();
      result.userName = datas.user.name();
    } else if (datas.role) {
      result.role = datas.role;
    } else {
      throw new Error('Subject not specified!');
    }
    return result;
  };

  this.record = rec => rec;

  this.filter = (filters) => {
    let result = [];
    if (filters.author) {
      result.push({[F.OR]: [
        {[F.EQUAL]: ['$authorId', filters.author]},
        {[F.EQUAL]: ['$authorName', filters.author]},
      ]});
    }
    if (filters.ip)
      result.push({[F.EQUAL]: ['$authorIp', filters.ip]});
    if (filters.subject) {
      result.push({[F.OR]: [
        {[F.EQUAL]: ['$userId', filters.subject]},
        {[F.EQUAL]: ['$userName', filters.subject]},
        {[F.EQUAL]: ['$role', filters.subject]}
      ]});
    }
    return result;
  };
}

dsRoleAccessChangeLogger.prototype = new ChangeLogger();
module.exports = dsRoleAccessChangeLogger;
module.exports.Types = RoleAccessChangeLoggerRecordTypes;