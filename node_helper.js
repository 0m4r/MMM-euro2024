/* Magic Mirror
 * Module: MMM-euro2021
 *
 * By 0m4r
 *
 */

const NodeHelper = require('node_helper');
const request = require('request');
const { version } = require('./package.json');
const Log = require('../../js/logger.js');

const { secret } = require('./.secret.js');

module.exports = NodeHelper.create({
  interval: null,
  defaults: {
    competitionId: 2018,
    updateInterval:  60 * 1000, // 1 minute
  },
  baseURL: 'https://api.football-data.org/v2/',
  scheduler: null,
  config: {},
  teams: null,
  secret: secret,

  start: function () {
    Log.log('Starting node helper for: ' + this.name);
  },

  stop: function () {
    Log.log('Stopping node helper for: ' + this.name);
    if (this.scheduler !== null) {
      this.scheduler.cancel()
    }
  },

  fetchMatchDay: function (competitionId = this.config.competitionId) {
    Log.debug(this.name, 'fetchMatchDay', competitionId);
      const url = `${this.baseURL}competitions/${competitionId}`;
      Log.info(this.name, 'fetchMatchDay', url);
      return new Promise((resolve, reject) => {
        request(
          {
            rejectUnauthorized: false,
            url,
            method: 'GET',
            headers: {
              'X-Auth-Token': this.secret
            },
          },
          (error, response, body) => {
            let currentMatchday = null
            if (!error && response.statusCode === 200 && body) {
              const parsedBody = JSON.parse(body)
              currentMatchday = parsedBody.seasons.find(s => s.id === 507).currentMatchday
              resolve(currentMatchday);
              // this.sendSocketNotification(this.name + 'MATCH_DAY', currentMatchday);
            } else {
              Log.error(this.name, 'fetchMatchDay', competitionId, error);
              reject(error)
            }
          }
        )
      })
  },

  fetchFixturesForMatchDay: function (matchDay, competitionId = this.config.competitionId) {
    Log.debug(this.name, 'fetchFixturesForMatchDay', competitionId, matchDay);
      const url = `${this.baseURL}competitions/${competitionId}/matches?matchday=${matchDay}`;
      Log.info(this.name, 'fetchFixturesForMatchDay', url);
      return new Promise((resolve, reject) => {
        request(
          {
            rejectUnauthorized: false,
            url,
            method: 'GET',
            headers: {
              'X-Auth-Token': this.secret
            },
          },
          (error, response, body) => {
            if (!error && response.statusCode === 200 && body) {
              resolve(body)
            } else {
              Log.error(this.name, 'fetchFixturesForMatchDay', competitionId, matchDay, error);
              reject(error)
            }
          }
        )
      })
  },

  fetchTeams: function (competitionId = this.config.competitionId) {
    Log.debug(this.name, 'fetchTeams', competitionId);
      const url = `${this.baseURL}competitions/${competitionId}/teams`;
      Log.info(this.name, 'fetchTeams', url);
      return new Promise((resolve, reject) => {
        request(
          {
            rejectUnauthorized: false,
            url,
            method: 'GET',
            headers: {
              'X-Auth-Token': this.secret
            },
          },
          (error, response, body) => {
            if (!error && response.statusCode === 200 && body) {
              resolve(body)
            } else {
              Log.error(this.name, 'fetchTeams', competitionId, error);
              reject(error)
            }
          }
        )
      })
  },

  fetchVersion: function () {
    const url =
      'https://raw.githubusercontent.com/0m4r/MMM-euro2021/main/package.json';
    Log.debug(this.name, 'fetchVersion', url);
    request(
      {
        rejectUnauthorized: false,
        url,
        method: 'GET',
      },
      (error, response, body) => {
        let remote = 0;
        if (!error && response.statusCode === 200) {
          const results = JSON.parse(body);
          remote = results.version || 0;
        } else {
          Log.error(this.name, 'fetchVersion', error);
        }
        this.sendSocketNotification(this.name + 'VERSION_RESULTS', {
          local: version,
          remote,
        });
      }
    );
  },

  fetchAllWithInterval: function () {
    try {
      clearInterval(this.interval);
      const fetch = () => {
        this.fetchAll();
        this.sendSocketNotification(this.name + 'NEXT_UPDATE', [new Date(), new Date(Date.now() + this.config.updateInterval)]);
        Log.info(this.name, 'fetchAllWithInterval| next execution scheduled for', new Date(Date.now() + this.config.updateInterval));
      }
      this.interval = setInterval(fetch, this.config.updateInterval);
      fetch();
    }catch(e){
      Log.error(this.name, 'fetchAllWithInterval', e)
    }
  },

  fetchAll: async function () {
      if(this.teams === null) {
        this.teams = await this.fetchTeams();
      }
      const matchDay = await this.fetchMatchDay();
      const fixtures = await this.fetchFixturesForMatchDay(matchDay);

      const matches = JSON.parse(fixtures).matches
      matches.forEach(m => {
        const teams = JSON.parse(this.teams).teams;
        const homeTeam = teams.find(t => t.id === m.homeTeam.id)
        if(homeTeam) {
          m.homeTeam.flag = homeTeam.crestUrl
        }

        const awayTeam = teams.find(t => t.id === m.awayTeam.id)
        if(awayTeam) {
          m.awayTeam.flag = awayTeam.crestUrl
        }
      })
      this.sendSocketNotification(this.name + 'FIXTURES', matches);
  },

  socketNotificationReceived: function (notification, payload) {
    Log.debug(this.name, notification, JSON.stringify(payload));
    if (notification === this.name + 'CONFIG') {
      this.config = {
        ...this.defaults,
        ...payload,
      };
      this.fetchAllWithInterval()
      this.fetchVersion();
    }
  },
});
