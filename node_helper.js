/* Magic Mirror
 * Module: MMM-euro2021
 *
 * By 0m4r
 *
 */

const NodeHelper = require('node_helper');
const { version } = require('./package.json');
const Log = require('../../js/logger.js');

const MAX_TIMEOUT_INTERVAL = 2147483647

module.exports = NodeHelper.create({
  interval: null,
  defaults: {
    competitionId: 2018, // Euro 2024
    updateInterval: 60 * 1000, // 1 minute
  },
  baseURL: 'https://api.football-data.org/v4/',
  config: {},
  teams: null,

  fetchOptions: {},

  start: function () {
    Log.log('Starting node helper for: ' + this.name);
  },

  stop: function () {
    Log.log('Stopping node helper for: ' + this.name);
  },

  fetchMatchDay: async function (competitionId = this.config.competitionId) {
    Log.debug(this.name, 'fetchMatchDay', competitionId);
    try {
      const url = `${this.baseURL}competitions/${competitionId}`;
      Log.info(this.name, 'fetchMatchDay', url);
      const response = await fetch(url, { ...this.fetchOptions });
      if (response.status === 200) {
        const json = await response.json()
        const currentMatchday = json.currentSeason.currentMatchday;
        return currentMatchday
      } else {
        throw response
      }
    } catch (e) {
      Log.error(this.name, 'fetchMatchDay', competitionId, await e.text());
      return null
    }
  },

  fetchFixturesForMatchDay: async function (matchDay, competitionId = this.config.competitionId) {
    if (!matchDay) return null;
    Log.debug(this.name, 'fetchFixturesForMatchDay', competitionId, matchDay);
    const url = `${this.baseURL}competitions/${competitionId}/matches?matchday=${matchDay}`;
    Log.info(this.name, 'fetchFixturesForMatchDay', url);
    try {
      const response = await fetch(url, { ...this.fetchOptions });
      if (response.status === 200) {
        const json = await response.json()
        return json
      } else {
        throw response
      }
    } catch (e) {
      Log.error(this.name, 'fetchFixturesForMatchDay', competitionId, matchDay, await e.text());
      return null
    }
  },

  fetchTeams: async function (competitionId = this.config.competitionId) {
    Log.debug(this.name, 'fetchTeams', competitionId);
    const url = `${this.baseURL}competitions/${competitionId}/teams`;
    Log.debug(this.name, 'fetchTeams | url', url);
    try {
      const response = await fetch(url, { ...this.fetchOptions });
      if (response.status === 200) {
        const json = await response.json()
        return json
      } else {
        throw response
      }
    } catch (e) {
      Log.error(this.name, 'fetchTeams', competitionId, await e.text());
      return null;
    }
  },

  fetchVersion: async function () {
    const url =
      'https://raw.githubusercontent.com/0m4r/MMM-euro2024/main/package.json';
    Log.debug(this.name, 'fetchVersion', url);
    const response = await fetch(url)

    try {
      if (response.status === 200) {
        const remote = await response.json()
        this.sendSocketNotification(this.name + 'VERSION_RESULTS', {
          local: version,
          remote: remote.version,
        });
      } else {
        throw await response.text()
      }
    } catch (e) {
      Log.error(this.name, 'fetchAllWithInterval', e)
    }
  },

  fetchAllWithInterval: function (interval = this.config.updateInterval, immediate = true) {
    interval = interval > MAX_TIMEOUT_INTERVAL ? MAX_TIMEOUT_INTERVAL : interval
    Log.debug(this.name, 'fetchAllWithInterval', interval)
    try {
      clearInterval(this.interval);
      const fetch = () => {
        this.fetchAll();
        this.sendSocketNotification(this.name + 'NEXT_UPDATE', [new Date(), new Date(Date.now() + interval)]);
        Log.info(this.name, 'fetchAllWithInterval | next execution scheduled for', new Date(Date.now() + interval));
      }
      if (immediate === true) {
        fetch()
      } else {
        this.sendSocketNotification(this.name + 'NEXT_UPDATE', [new Date(), new Date(Date.now() + interval)]);
        this.interval = setInterval(fetch, interval);
        Log.info(this.name, 'fetchAllWithInterval | next execution scheduled for', new Date(Date.now() + interval));
      }
    } catch (e) {
      Log.error(this.name, 'fetchAllWithInterval', e)
    }
  },

  fetchAll: async function () {
    const self = this;
    try {
      if (this.teams === null) {
        this.teams = await this.fetchTeams();
      }
      const matchDay = await this.fetchMatchDay();
      const fixtures = await this.fetchFixturesForMatchDay(matchDay);

      const matches = fixtures?.matches || []
      matches.forEach(m => {
        const { teams } = this.teams;
        const homeTeam = teams.find(t => t.id === m.homeTeam.id)
        if (homeTeam) {
          m.homeTeam.flag = homeTeam.crest
        }

        const awayTeam = teams.find(t => t.id === m.awayTeam.id)
        if (awayTeam) {
          m.awayTeam.flag = awayTeam.crest
        }
      })

      let statuses = matches.map(m => m.status);
      const hasActiveGames = statuses.includes('PAUSED') || statuses.includes('IN_PLAY')
      const hasTimedGames = statuses.every(s => s === "TIMED")
      if (!hasActiveGames) {
        const dates = matches.map(m => m.utcDate);
        const nextDates = this.findNextGameDate(dates, true)
        if (nextDates && nextDates.length > 0) {
          const next = nextDates[0];
          const timeUntilNextGame = new Date(next) - new Date();
          const timeUntilNextGameMinusFiveMinutes = timeUntilNextGame - 5 * 60 * 1000
          if (timeUntilNextGameMinusFiveMinutes > 0) {
            Log.info(this.name, 'fetchAll | timeUntilNextGame', timeUntilNextGameMinusFiveMinutes, new Date(new Date().getTime() + timeUntilNextGameMinusFiveMinutes));
            self.fetchAllWithInterval(timeUntilNextGameMinusFiveMinutes, false);
          }
        }
      }

      const matchesGroupedByDate = this.groupByDate(matches)
      this.sendSocketNotification(this.name + 'FIXTURES', matchesGroupedByDate);
    } catch (e) {
      Log.error(this.name, 'fetchAll', await e.text())
      this.sendSocketNotification(this.name + 'FIXTURES', []);
    }
  },

  findNextGameDate: function (datesArray, after = true) {
    var arr = [...datesArray];
    var now = new Date();

    arr.sort(function (a, b) {
      var distanceA = Math.abs(now - new Date(a));
      var distanceB = Math.abs(now - new Date(b));
      return distanceA - distanceB; // sort a before b when the distance is smaller
    });

    const prev = arr.filter((d) => new Date(d) - now < 0);
    const next = arr.filter((d) => new Date(d) - now > 0);

    return after ? next : prev;
  },

  groupByDate: function (data) {
    // this gives an object with dates as keys
    const groups = data.reduce((groups, game) => {
      const date = game.utcDate.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(game);
      return groups;
    }, {});

    // Edit: to add it in the array format instead
    const groupArrays = Object.keys(groups).map((date) => {
      return {
        date,
        games: groups[date]
      };
    });

    return groupArrays
  },

  socketNotificationReceived: function (notification, payload) {
    Log.info(this.name, "socketNotificationReceived", notification, JSON.stringify(payload));
    if (notification === this.name + 'CONFIG') {
      this.config = {
        ...this.defaults,
        ...payload,
      };

      Log.info(this.name, "socketNotificationReceived | config", JSON.stringify(this.config));

      this.fetchOptions = {
        method: 'GET',
        headers: {
          'X-Auth-Token': this.config.token
        }
      }

      Log.info(this.name, "socketNotificationReceived | fetchOptions", JSON.stringify(this.fetchOptions));
      this.fetchAllWithInterval()
      this.fetchVersion();
    }
  },
});
