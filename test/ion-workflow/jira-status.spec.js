/**
* Тестируем инициализацию баз данных
* TODO реализовать(!)
*/

'use strict';

// Уточняем параметры jsHint.
// expr - убрать предупреждение для функций без (): expect(...).to.have.been.called или expect(...).to.be.ok
// maxstatements - множественные describe/it/expect одного уровня в одной группе describe или it
// jshint expr: true, maxstatements:20

const fs = require('fs');
const path = require('path');

if (!process.env.ION_JIRA_USER || !process.env.ION_JIRA_PASSWORD) {
  console.warn('Тест пропущен, т.к. не заданы учетные данны для джира в ION_JIRA_USER и ION_JIRA_PASSWORD');
}

describe('# Проверка статуса бизнес-процесса по задаче "мердж"', function () {
  this.timeout(60000);
  it('Для текущей ветки в гит, должен быть установлен статус "Мердж" в Jira', (done) => {
    try {
      let foldersToGitCheck = [path.join(__dirname, '../..')];
      foldersToGitCheck = foldersToGitCheck.concat(getFolderInDir(path.join(__dirname, '../../applications')),
        getFolderInDir(path.join(__dirname, '../../modules')));
      console.log('Проверяем статусы ', foldersToGitCheck);
      let tasksCodeToCheck = [];
      let qntCheckRes = 0;
      let onceErr = false;
      foldersToGitCheck.forEach((folder, i) => {
        const branchName = fs.readFileSync(path.join(folder, '.git/HEAD'))
          .toString()
          .replace('\n', '')
          .split('/');
        let taskCode =  branchName[branchName.length - 1].split('_')[0];
        if (/^([A-Za-z]+)-(\d+)/i.test(taskCode) &&  tasksCodeToCheck.indexOf(taskCode) === -1) {
          tasksCodeToCheck.push(taskCode);
          setTimeout(() => {
            if (!onceErr) { // Если ошибка уже была, прекращаем новые запросы
              checkMergeStatus(taskCode)
                .then((status) => {
                  console.log('Компонент ' + folder + ' с веткой задачи ' + taskCode + ' имеет статус:', status);
                  if (!onceErr && status !== 'Мердж') {
                    onceErr = true;
                    done(new Error('Компонент ' + folder + ' с веткой задачи ' + taskCode + ' имеет статус ' + status + ' вместо Мердж'));
                  }
                  if (!onceErr && ++qntCheckRes === tasksCodeToCheck.length) {
                    console.log('Проверенные статусы Мердж у задач:', tasksCodeToCheck.toString());
                    done();
                  }
                })
                .catch((e) => {
                  console.log('Ошибка осуществления запросов в Jira, пропускаем тестирование\n', e);
                  done();
                });

            }
          }, 1000 * (tasksCodeToCheck.length - 1));

        } else {
          console.log('Компонент ' + folder + ' в ветке ' + taskCode + ' не соодержит признаков задачи');
        }
      });
    } catch (e) {
      console.log('Ошибка формирования папок гит, пропускаем тестирование\n', e);
      done();
    }

  });
});

/**
 * Функция получения списка дирректорий в указанном каталоге
 * @param {String} dir
 * @returns {Array}
 */
function getFolderInDir(dir) {
  let folders = [];
  try {
    fs.accessSync(dir, fs.constants.F_OK);
    let files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
      let fn = path.join(dir, files[i]);
      let stat = fs.lstatSync(fn);
      if (stat.isDirectory()) {
        folders.push(fn);
      }
    }
  } catch (e) {
    throw e;
  }
  return folders;
}

function checkMergeStatus(taskCode) {
  const https = require('https');
  return new Promise(function (resolve, reject) {
    https.get({hostname: 'ion-dv.atlassian.net',
      path: '/rest/api/2/issue/' + taskCode,
      auth: process.env.ION_JIRA_USER + ':' + process.env.ION_JIRA_PASSWORD}, (res) => {
      let onceErr = false;
      if (res.statusCode !== 200) {
        reject(new Error('Ошибка запроса, код ответа ' + res.statusCode));
        onceErr = true;
      }
      res.on('data', (d) => {
        if (!onceErr) { // Если уже было сообщение об ошибке, не нужно проверять
          let regexpMerge = /(?:"status":.+?"name": ?")([А-Яа-яЕёA-Za-z]*)/i;   // Альтернатива id вместо name
          let status = 'Ошибка поиска статуса';
          try {
            let data = d.toString();
            let isMerge = data.match(regexpMerge);
            if (isMerge && isMerge[1]) {
              status = isMerge[1];
            }
          } catch (e) {
            console.error('Ошибка парсинга ответа Jira\n', e, '\n', d.toString());
          }
          finally {
            resolve(status);
          }
        }

      });

    }).on('error', (e) => {
      reject(e);
    });
  });
}
