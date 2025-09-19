document.getElementById('currentYear').textContent = new Date().getFullYear();

const todayList = document.getElementById('todayList');
const weekList = document.getElementById('weekList');
const monthList = document.getElementById('monthList');
const nearFutureSection = document.getElementById('nearFutureSection');
const nearFutureList = document.getElementById('nearFutureList');

const repoModal = new bootstrap.Modal(document.getElementById('repoModal'));
const modalBody = document.getElementById('modalBody');

const searchInput = document.getElementById('searchInput');
const categoriesDiv = document.getElementById('categoriesDiv');
const languagesDiv = document.getElementById('languagesDiv');
const topicsDiv = document.getElementById('topicsDiv');

let data = [];
const selectedCategories = new Set();
const selectedLanguages = new Set();
const selectedTopics = new Set();

function formatDateIsoToReadable(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isSameMonthDay(d1, d2) {
    return d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function getWeekMonthDays() {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
        const dt = new Date(now);
        dt.setDate(now.getDate() + i);
        days.push({ month: dt.getMonth(), date: dt.getDate() });
    }
    return days;
}

function isDateInCurrentMonthDayOnly(date) {
    const now = new Date();
    const d = new Date(date);
    return d.getMonth() === now.getMonth();
}

function compareMonthDay(a, b) {
    if (a.getMonth() === b.getMonth()) {
        return a.getDate() - b.getDate();
    }
    return a.getMonth() - b.getMonth();
}

function hasBirthdayPassedThisYear(createdAtDate) {
    const now = new Date();
    const birthdayThisYear = new Date(now.getFullYear(), createdAtDate.getMonth(), createdAtDate.getDate());
    return birthdayThisYear < now;
}

function calculateRepoAgeYears(createdAtDate) {
    const now = new Date();
    let age = now.getFullYear() - createdAtDate.getFullYear();
    const thisYearsBirthday = new Date(now.getFullYear(), createdAtDate.getMonth(), createdAtDate.getDate());
    if (now < thisYearsBirthday) {
        age--;
    }
    return age >= 0 ? age : 0;
}

function calculateUpcomingAgeYears(createdAtDate) {
    const now = new Date();
    const thisYearsBirthday = new Date(now.getFullYear(), createdAtDate.getMonth(), createdAtDate.getDate());
    if (thisYearsBirthday >= now) {
        return thisYearsBirthday.getFullYear() - createdAtDate.getFullYear();
    } else {
        return thisYearsBirthday.getFullYear() - createdAtDate.getFullYear() + 1;
    }
}

function createRepoCard(repo, isSearchMode = false, searchText = '', section = '') {
    const card = document.createElement('div');
    card.className = 'card repo-card';
    card.style.cursor = 'pointer';
    card.style.justifyContent = 'center';

    const createdAtDate = new Date(repo._created_at);

    let ageYears;
    if (section === 'today') {
        ageYears = calculateRepoAgeYears(createdAtDate);
    } else {
        ageYears = calculateUpcomingAgeYears(createdAtDate);
    }

    if (
        !isSearchMode &&
        hasBirthdayPassedThisYear(createdAtDate) &&
        !(section === 'today' && isSameMonthDay(createdAtDate, new Date()))
    ) {
        card.style.opacity = '0.5';
    } else {
        card.style.opacity = '1';
    }

    let ageClass = '';
    if (ageYears && (ageYears === 1 || ageYears === 3 || (ageYears >= 5 && ageYears % 5 === 0))) {
        ageClass = 'age-jubilee';
    }

    card.innerHTML = `
    <img src="${repo._avatar_url || 'https://avatars.githubusercontent.com/u/0?v=4'}" alt="Avatar" class="avatar" />
    <div>
      <div class="repo-name">${highlightText(repo._reponame, isSearchMode ? searchText : '')}</div>
      <div class="repo-date">${formatDateIsoToReadable(repo._created_at)}</div>
      <div class="repo-category">${repo.category || ''}</div>
      <div class="repo-language">${repo._language || ''}</div>
      <div class="repo-age ${ageClass}">${ageYears ? ageYears + ' year' + (ageYears > 1 ? 's' : '') : ''}</div>
    </div>
  `;

    card.addEventListener('click', () => {
        showModal(repo, ageYears);
    });

    return card;
}

function highlightText(text, searchText) {
    if (!searchText) return text;
    const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function showModal(repo, ageYears) {
    const topicsHtml = (repo._github_topics && repo._github_topics.length) ?
        `<div><strong>Topics: </strong>${repo._github_topics.map(t => `<span class="topic-chip mb-2">${t}</span>`).join(' ')}</div>` : '';

    const ageClass = (ageYears === 1 || ageYears === 3 || (ageYears >= 5 && ageYears % 5 === 0)) ? 'age-jubilee' : '';

    let homepageLink = '';
    if (repo._homepage && repo._homepage.trim() !== '') {
        homepageLink = `
          <a href="${repo._homepage}" target="_blank" rel="noopener noreferrer">
            <i class="bi bi-globe me-2"></i>Homepage
          </a>`;
    }

    modalBody.innerHTML = `
    <div class="d-flex align-items-start mb-3">
      <img src="${repo._avatar_url || 'https://avatars.githubusercontent.com/u/0?v=4'}" alt="Avatar" class="avatar" style="width:128px; height:128px; margin-right: 12px; border-radius: 8px;" />
      <div>
          <h4>${repo._reponame}</h4>
          <div style="opacity: 0.7; font-size: 0.9rem;">${repo.category || ''}</div>
          <div style="opacity: 0.7; font-size: 0.9rem;">${repo._language || ''}</div>
          <div class="repo-age ${ageClass}" style="opacity: 0.7; font-size: 0.9rem; margin-top: 4px;">
            ${ageYears ? ageYears + ' year' + (ageYears > 1 ? 's' : '') : ''}
          </div>
          ${topicsHtml}
      </div>
    </div>

    <p><strong>Created at:</strong> ${formatDateIsoToReadable(repo._created_at)}</p>
    <p><strong>Organization:</strong> ${repo._organization || 'N/A'}</p>
    <p><strong>Description:</strong> ${repo._github_description || repo._description || 'No description'}</p>
    <p>
      <a href="${repo.githuburl || `https://github.com/${repo._repopath}`}" target="_blank" rel="noopener noreferrer"><i class="bi bi-github me-2"></i>GitHub</a>
      ${homepageLink}
    </p>
    `;

    repoModal.show();
}


function categorizeRepositories(repos) {
    const today = new Date();
    const weekDays = getWeekMonthDays();

    const todayRepos = [];
    const weekRepos = [];
    const monthRepos = [];

    repos.forEach(repo => {
        repo.dateObj = new Date(repo._created_at);

        const createdAtDate = repo.dateObj;

        if (isSameMonthDay(createdAtDate, today)) {
            todayRepos.push(repo);
        } else if (weekDays.some(d => d.month === createdAtDate.getMonth() && d.date === createdAtDate.getDate())) {
            weekRepos.push(repo);
        } else if (isDateInCurrentMonthDayOnly(createdAtDate)) {
            monthRepos.push(repo);
        }
    });

    todayRepos.sort((a, b) => compareMonthDay(a.dateObj, b.dateObj));
    weekRepos.sort((a, b) => compareMonthDay(a.dateObj, b.dateObj));
    monthRepos.sort((a, b) => compareMonthDay(a.dateObj, b.dateObj));

    return { todayRepos, weekRepos, monthRepos };
}

function filterAndRender() {
    const searchText = searchInput.value.trim().toLowerCase();

    if (searchText) {
        const filteredData = data.filter(repo => repo._reponame.toLowerCase().includes(searchText));
        renderListsWithNearFuture(filteredData, searchText);
    } else {
        const filteredData = data.filter(repo => {
            if (selectedCategories.size > 0 && !selectedCategories.has(repo.category)) return false;
            if (selectedLanguages.size > 0 && !selectedLanguages.has(repo._language)) return false;
            if (selectedTopics.size > 0 && (!repo._github_topics || !repo._github_topics.some(t => selectedTopics.has(t)))) return false;
            return true;
        });
        renderLists(filteredData);
    }
}

function renderLists(repos) {
    todayList.innerHTML = '';
    weekList.innerHTML = '';
    monthList.innerHTML = '';
    nearFutureList.innerHTML = '';

    let hiddenSections = 0;

    if (repos.length === 0) {
        todayList.innerHTML = '<p class="text-muted">No repositories matching filter.</p>';
        weekList.innerHTML = '';
        monthList.innerHTML = '';
        nearFutureList.innerHTML = '';
        return;
    }

    const { todayRepos, weekRepos, monthRepos } = categorizeRepositories(repos);

    if (todayRepos.length === 0) {
        document.getElementById('todaySection').style.display = 'none';
        hiddenSections++;
    } else {
        todayRepos.forEach(repo => todayList.appendChild(createRepoCard(repo, false, '', 'today')));
        document.getElementById('todaySection').style.display = 'block';
    }

    if (weekRepos.length === 0) {
        document.getElementById('weekSection').style.display = 'none';
        hiddenSections++;
    } else {
        weekRepos.forEach(repo => weekList.appendChild(createRepoCard(repo, false, '', 'week')));
        document.getElementById('weekSection').style.display = 'block';
    }

    if (monthRepos.length === 0) {
        document.getElementById('monthSection').style.display = 'none';
        hiddenSections++;
    } else {
        monthRepos.forEach(repo => monthList.appendChild(createRepoCard(repo, false, '', 'month')));
        document.getElementById('monthSection').style.display = 'block';
    }

    if (hiddenSections === 3) {
        nearFutureSection.style.display = 'block';
        nearFutureList.innerHTML = '<p class="text-muted">No repositories found.</p>';
    } else {
        nearFutureSection.style.display = 'none';
        nearFutureList.innerHTML = '';
    }
}

function renderListsWithNearFuture(filteredRepos, searchText) {
    todayList.innerHTML = '';
    weekList.innerHTML = '';
    monthList.innerHTML = '';
    nearFutureList.innerHTML = '';
    nearFutureSection.style.display = 'block';

    if (filteredRepos.length === 0) {
        const noResult = '<p class="text-muted">No repositories found.</p>';
        todayList.innerHTML = noResult;
        weekList.innerHTML = noResult;
        monthList.innerHTML = noResult;
        nearFutureList.innerHTML = noResult;
        return;
    }

    const { todayRepos, weekRepos, monthRepos } = categorizeRepositories(filteredRepos);

    let nearFutureRepos = filteredRepos.filter(repo =>
        !todayRepos.includes(repo) &&
        !weekRepos.includes(repo) &&
        !monthRepos.includes(repo));

    if (todayRepos.length === 0) {
        document.getElementById('todaySection').style.display = 'none';
    } else {
        todayRepos.forEach(repo => todayList.appendChild(createRepoCard(repo, true, searchText, 'today')));
        document.getElementById('todaySection').style.display = 'block';
    }

    if (weekRepos.length === 0) {
        document.getElementById('weekSection').style.display = 'none';
    } else {
        weekRepos.forEach(repo => weekList.appendChild(createRepoCard(repo, true, searchText, 'week')));
        document.getElementById('weekSection').style.display = 'block';
    }

    if (monthRepos.length === 0) {
        document.getElementById('monthSection').style.display = 'none';
    } else {
        monthRepos.forEach(repo => monthList.appendChild(createRepoCard(repo, true, searchText, 'month')));
        document.getElementById('monthSection').style.display = 'block';
    }

    if (nearFutureRepos.length === 0) {
        nearFutureList.innerHTML = '<p class="text-muted">No repositories found for the near future.</p>';
    } else {
        nearFutureRepos.forEach(repo => nearFutureList.appendChild(createRepoCard(repo, true, searchText, 'nearFuture')));
    }
}

function populateCategoriesChips() {
    const categories = [...new Set(data.map(repo => repo.category).filter(Boolean))].sort();
    categoriesDiv.innerHTML = '';
    categories.forEach(cat => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = cat;

        chip.addEventListener('click', () => {
            if (selectedCategories.has(cat)) {
                selectedCategories.delete(cat);
                chip.classList.remove('selected');
            } else {
                selectedCategories.add(cat);
                chip.classList.add('selected');
            }
            filterAndRender();
        });
        categoriesDiv.appendChild(chip);
    });
}

function populateLanguagesChips() {
    const languages = [...new Set(data.map(repo => repo._language).filter(Boolean))].sort();
    languagesDiv.innerHTML = '';
    languages.forEach(lang => {
        const chip = document.createElement('div');
        chip.className = 'chip lang-chip';
        chip.textContent = lang;

        chip.addEventListener('click', () => {
            if (selectedLanguages.has(lang)) {
                selectedLanguages.delete(lang);
                chip.classList.remove('selected');
            } else {
                selectedLanguages.add(lang);
                chip.classList.add('selected');
            }
            filterAndRender();
        });
        languagesDiv.appendChild(chip);
    });
}

function populateTopicsChips() {
    const topics = [...new Set(data.flatMap(repo => repo._github_topics || []))].sort();
    topicsDiv.innerHTML = '';
    topics.forEach(topic => {
        const chip = document.createElement('div');
        chip.className = 'chip topic-chip';
        chip.textContent = topic;

        chip.addEventListener('click', () => {
            if (selectedTopics.has(topic)) {
                selectedTopics.delete(topic);
                chip.classList.remove('selected');
            } else {
                selectedTopics.add(topic);
                chip.classList.add('selected');
            }
            filterAndRender();
        });
        topicsDiv.appendChild(chip);
    });
}

searchInput.addEventListener('input', filterAndRender);

fetch('github_stardata.json')
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;
        populateCategoriesChips();
        populateLanguagesChips();
        // populateTopicsChips();
        filterAndRender();
    })
    .catch(() => {
        todayList.innerHTML = '<p class="text-danger">Failed to load data.</p>';
        weekList.innerHTML = '';
        monthList.innerHTML = '';
        nearFutureList.innerHTML = '';
    });

