/* Magic Mirror
 * Module: MMM-euro2021
 *
 * By 0m4r
 *
 */

Module.register('MMM-euro2021', {
  fixtures: [],
  loaded: false,
  nextUpdate: [],

  start: function () {
    Log.info('Starting module ' + this.name);
    Log.debug('with config: ' + JSON.stringify(this.config));
    this.sendSocketNotification(this.name + 'CONFIG', this.config);
  },

  stop: function () {
    Log.info('Stopping module ' + this.name);
  },

  resume: function () {
    Log.info('Resuming module ' + this.name);
    Log.debug('with config: ' + JSON.stringify(this.config));
    this.sendSocketNotification('CONFIG', this.config);
  },

  getDom: function () {
    const wrapper = document.createElement('div');
    wrapper.className = 'MMM-euro2021';

    if (!this.loaded) {
      wrapper.innerHTML = 'Loading...';
      return wrapper;
    }

    const p_header = document.createElement('p');
    p_header.className = 'MMM-euro2021-header';
    const p_header_text = document.createTextNode(
      'Euro 2020 data powered by https://api.football-data.org'
    );
    p_header.appendChild(p_header_text);
    wrapper.appendChild(p_header);

    const buildTD = (value = '', classes = null) => {
      const td = document.createElement('td');
      td.classList.add(classes)
      td.innerHTML = value;
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
    table.classList.add('xsmall', 'MMM-euro2021-table');
    wrapper.appendChild(table);

    const tr = document.createElement('tr');
      table.appendChild(tr);
      tr.appendChild(buildTH('date'));
      tr.appendChild(buildTH('group'));
      tr.appendChild(buildTH(''));
      tr.appendChild(buildTH(''));
      tr.appendChild(buildTH(''));
      tr.appendChild(buildTH(''));
      tr.appendChild(buildTH(''));

    this.fixtures.forEach(m => {
      const tr = document.createElement('tr');
      table.appendChild(tr);
      tr.appendChild(buildTD(new Date(m.utcDate).toLocaleString()));
      tr.appendChild(buildTD(m.group));
      tr.appendChild(buildTD(m.homeTeam.name, 'MMM-euro2021-homeTeam'));
      tr.appendChild(buildTDForFlag(m.homeTeam.flag, 'MMM-euro2021-flag'));
      tr.appendChild(buildTD(m.score.fullTime.homeTeam, 'MMM-euro2021-score'));
      tr.appendChild(buildTD('-'));
      tr.appendChild(buildTD(m.score.fullTime.awayTeam, 'MMM-euro2021-score'));
      tr.appendChild(buildTDForFlag(m.awayTeam.flag, 'MMM-euro2021-flag'));
      tr.appendChild(buildTD(m.awayTeam.name, 'MMM-euro2021-awayTeam'));

      tr.classList.add(this.name + '-' + m.status)
    })

    // FOOTER --
    const p_footer = document.createElement('p');
    p_footer.classList.add('MMM-euro2021-footer');
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
      p_footer_left.classList.add('MMM-euro2021-footer-left');
      p_footer.appendChild(p_footer_left);
      p_footer_left.appendChild(
        spanForFooter(
          'Next API request: ' + new Date(this.nextUpdate[1]).toLocaleString(),
          'MMM-euro2021-footer-dates'
        )
      );
    }

    if (this.version && 'local' in this.version && 'remote' in this.version) {
      const p_footer_right = document.createElement('p');
      p_footer_right.classList.add('MMM-euro2021-footer-right');
      p_footer.appendChild(p_footer_right);
      p_footer_right.appendChild(
        spanForFooter(
          'installed version:' + this.version.local,
          'MMM-euro2021-footer-version'
        )
      );
      p_footer_right.appendChild(spanForFooter(' '));
      p_footer_right.appendChild(
        spanForFooter(
          'latest version:' + this.version.remote,
          'MMM-euro2021-footer-version'
        )
      );
      if (this.version.local !== this.version.remote) {
        p_footer_right.classList.add('MMM-euro2021-footer-version-update');
      }
    }


    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    Log.debug(this.name, 'socketNotificationReceived', notification);
    Log.debug(this.name, 'socketNotificationReceived', payload);

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
    return ['MMM-euro2021.css'];
  },
});
