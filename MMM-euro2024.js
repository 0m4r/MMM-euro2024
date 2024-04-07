/* Magic Mirror
 * Module: MMM-euro2024
 *
 * By 0m4r
 *
 */

Module.register('MMM-euro2024', {
  fixtures: [],
  loaded: false,
  nextUpdate: [],

  defaults: {
    updateInterval: 60 * 60 * 1000,
    competitionId: "2018",
    token: "",
  },

  start: function () {
    Log.info('Starting module ' + this.name);
    Log.info('with config: ' + JSON.stringify(this.config));
    this.sendSocketNotification(this.name + 'CONFIG', this.config);
  },

  stop: function () {
    Log.info('Stopping module ' + this.name);
  },

  resume: function () {
    Log.info('Resuming module ' + this.name);
    Log.debug('with config: ' + JSON.stringify(this.config));
    this.sendSocketNotification(this.name + 'CONFIG', this.config);
  },

  getDom: function () {
    const wrapper = document.createElement('div');
    wrapper.className = 'MMM-euro2024';

    if (!this.loaded) {
      wrapper.innerHTML = 'Loading...';
      return wrapper;
    }

    const buildTD = (value = '', classes = [], colspan = 1) => {
      const td = document.createElement('td');
      let classNames = classes
      if (!Array.isArray(classes)) {
        classNames = [classes]
      }
      td.classList.add(...classNames)
      td.innerHTML = value;
      td.setAttribute('colspan', colspan);
      return td;
    }

    const buildTDForFlag = (value, classes) => {
      const td = buildTD('', classes)
      const img = document.createElement('img')
      img.src = value
      img.style.width = '20px'
      img.style.height = '20px'
      td.appendChild(img)
      return td;
    }

    const buildTH = (value) => {
      const th = document.createElement('th');
      th.innerHTML = value;
      return th;
    }

    const table = document.createElement('table');
    table.classList.add('xsmall', 'MMM-euro2024-table');
    wrapper.appendChild(table);

    this.fixtures.forEach(f => {
      const tr = document.createElement('tr');
      tr.appendChild(buildTD(new Date(f.date).toLocaleDateString(), 'MMM-euro2024-date', 7));
      table.appendChild(tr)

      f.games.forEach(m => {
        const tr1 = document.createElement('tr');
        const time = new Date(m.utcDate).toLocaleTimeString()
        const group = m.group
        tr1.appendChild(buildTD(time + " " + group, [], 7));
        tr1.classList.add('MMM-euro2024-' + m.status, 'MMM-euro2024-time-group')
        table.appendChild(tr1)

        const tr = document.createElement('tr');
        tr.appendChild(buildTD(m.homeTeam.name, 'MMM-euro2024-homeTeam'));
        tr.appendChild(buildTDForFlag(m.homeTeam.flag, 'MMM-euro2024-flag'));
        tr.appendChild(buildTD(m.score.fullTime.homeTeam, 'MMM-euro2024-score'));
        tr.appendChild(buildTD('-'));
        tr.appendChild(buildTD(m.score.fullTime.awayTeam, 'MMM-euro2024-score'));
        tr.appendChild(buildTDForFlag(m.awayTeam.flag, 'MMM-euro2024-flag'));
        tr.appendChild(buildTD(m.awayTeam.name, 'MMM-euro2024-awayTeam'));
        table.appendChild(tr)

        tr.classList.add('MMM-euro2024-' + m.status)
      });
    });

    // FOOTER --
    const p_footer = document.createElement('footer');
    p_footer.classList.add('MMM-euro2024-footer');
    wrapper.appendChild(p_footer);

    const spanForFooter = (label, className) => {
      const span_footer = document.createElement('span');
      span_footer.classList.add(className);
      const span_footer_text = document.createTextNode(label);
      span_footer.appendChild(span_footer_text);
      return span_footer;
    };

    if (this.nextUpdate && this.nextUpdate[1]) {
      const p_footer_left = document.createElement('p');
      p_footer_left.classList.add('MMM-euro2024-footer-left');
      p_footer.appendChild(p_footer_left);
      p_footer_left.appendChild(
        spanForFooter(
          'Next API request: ' + new Date(this.nextUpdate[1]).toLocaleString() + ' powered by https://api.football-data.org',
          'MMM-euro2024-footer-dates'
        )
      );
    }

    if (this.version && 'local' in this.version && 'remote' in this.version) {
      const p_footer_right = document.createElement('p');
      p_footer_right.classList.add('MMM-euro2024-footer-right');
      p_footer.appendChild(p_footer_right);
      p_footer_right.appendChild(
        spanForFooter(
          'installed version:' + this.version.local,
          'MMM-euro2024-footer-version'
        )
      );
      if (this.version.local !== this.version.remote) {
        p_footer_right.appendChild(spanForFooter(' '));
        p_footer_right.appendChild(
          spanForFooter(
            'latest version:' + this.version.remote,
            'MMM-euro2024-footer-version'
          )
        );
        p_footer_right.classList.add('MMM-euro2024-footer-version-update');
      }
    }


    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    Log.info(this.name, 'socketNotificationReceived', notification);
    Log.info(this.name, 'socketNotificationReceived', payload);

    if (notification === this.name + 'VERSION_RESULTS') {
      this.loaded = true;
      this.version = {};
      if (payload && Object.keys(payload).length > 0) {
        this.version = payload;
      }
      this.updateDom();
    }

    if (notification === this.name + 'FIXTURES') {
      this.loaded = true;
      this.fixtures = payload;
      this.updateDom();
    }

    if (notification === this.name + 'NEXT_UPDATE') {
      this.loaded = true,
        this.nextUpdate = payload;
      this.updateDom();
    }
  },

  getStyles: function () {
    return ['MMM-euro2024.css'];
  },
});
