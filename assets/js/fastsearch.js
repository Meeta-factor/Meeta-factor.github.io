import * as params from '@params';

let fuse;
const resList = document.getElementById('searchResults');
const sInput = document.getElementById('searchInput');
const statusText = document.getElementById('searchStatus');
let first;
let last;
let currentElem = null;
let resultsAvailable = false;

function setStatus(text) {
    if (statusText) {
        statusText.textContent = text;
    }
}

function trimText(value, limit = 120) {
    if (!value) {
        return '';
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized.length <= limit) {
        return normalized;
    }

    return `${normalized.slice(0, limit).trimEnd()}...`;
}

function renderResults(results, query) {
    if (!results.length) {
        resultsAvailable = false;
        resList.innerHTML = '';
        setStatus(`没有找到和“${query}”相关的内容。`);
        return;
    }

    const resultSet = results.map(({ item }) => {
        const summary = trimText(item.summary || item.content);
        const section = trimText(item.section || item.categories?.join(' / ') || item.tags?.join(' / '), 40);

        return `<li class="search-result-card post-entry">
            <article class="search-result-body">
                <div class="search-result-top">
                    ${section ? `<span class="search-result-section">${section}</span>` : ''}
                    <span class="search-result-arrow" aria-hidden="true">↗</span>
                </div>
                <header class="entry-header">${item.title}</header>
                ${summary ? `<p class="search-result-summary">${summary}</p>` : ''}
                <a href="${item.permalink}" aria-label="${item.title}"></a>
            </article>
        </li>`;
    }).join('');

    resList.innerHTML = resultSet;
    resultsAvailable = true;
    first = resList.firstChild;
    last = resList.lastChild;
    setStatus(`找到 ${results.length} 条与“${query}”相关的结果。`);
}

function activeToggle(element) {
    document.querySelectorAll('.focus').forEach((item) => {
        item.classList.remove('focus');
    });

    if (element) {
        element.focus();
        currentElem = element;
        element.parentElement.classList.add('focus');
    } else if (document.activeElement?.parentElement) {
        document.activeElement.parentElement.classList.add('focus');
    }
}

function reset() {
    resultsAvailable = false;
    resList.innerHTML = '';
    sInput.value = '';
    setStatus('开始输入以搜索全站内容。');
    sInput.focus();
}

window.onload = function () {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) {
            return;
        }

        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            if (!data) {
                setStatus('搜索索引为空。');
                return;
            }

            let options = {
                distance: 100,
                threshold: 0.4,
                ignoreLocation: true,
                keys: ['title', 'permalink', 'summary', 'content']
            };

            if (params.fuseOpts) {
                options = {
                    isCaseSensitive: params.fuseOpts.iscasesensitive ?? false,
                    includeScore: params.fuseOpts.includescore ?? false,
                    includeMatches: params.fuseOpts.includematches ?? false,
                    minMatchCharLength: params.fuseOpts.minmatchcharlength ?? 1,
                    shouldSort: params.fuseOpts.shouldsort ?? true,
                    findAllMatches: params.fuseOpts.findallmatches ?? false,
                    keys: params.fuseOpts.keys ?? ['title', 'permalink', 'summary', 'content'],
                    location: params.fuseOpts.location ?? 0,
                    threshold: params.fuseOpts.threshold ?? 0.4,
                    distance: params.fuseOpts.distance ?? 100,
                    ignoreLocation: params.fuseOpts.ignorelocation ?? true
                };
            }

            fuse = new Fuse(data, options);
            setStatus('索引已加载，可以开始搜索。');
        } else {
            console.log(xhr.responseText);
            setStatus('搜索索引加载失败。');
        }
    };

    xhr.open('GET', '../index.json');
    xhr.send();
};

sInput.onkeyup = function () {
    const query = this.value.trim();

    if (!query) {
        resultsAvailable = false;
        resList.innerHTML = '';
        setStatus('开始输入以搜索全站内容。');
        return;
    }

    if (!fuse) {
        setStatus('搜索索引加载中，请稍候。');
        return;
    }

    const results = params.fuseOpts
        ? fuse.search(query, { limit: params.fuseOpts.limit })
        : fuse.search(query);

    renderResults(results, query);
};

sInput.addEventListener('search', function () {
    if (!this.value) {
        reset();
    }
});

document.onkeydown = function (e) {
    const key = e.key;
    let activeElement = document.activeElement;
    const searchBox = document.getElementById('searchbox');
    const inSearchBox = searchBox && searchBox.contains(activeElement);

    if (activeElement === sInput) {
        document.querySelectorAll('.focus').forEach((element) => {
            element.classList.remove('focus');
        });
    } else if (currentElem) {
        activeElement = currentElem;
    }

    if (key === 'Escape') {
        if (sInput.value.trim()) {
            reset();
        } else if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
        return;
    }

    if (!resultsAvailable || !inSearchBox) {
        return;
    }

    if (key === 'ArrowDown') {
        e.preventDefault();
        if (activeElement === sInput) {
            activeToggle(resList.firstChild.lastChild);
        } else if (activeElement.parentElement !== last) {
            activeToggle(activeElement.parentElement.nextSibling.lastChild);
        }
    } else if (key === 'ArrowUp') {
        e.preventDefault();
        if (activeElement.parentElement === first) {
            activeToggle(sInput);
        } else if (activeElement !== sInput) {
            activeToggle(activeElement.parentElement.previousSibling.lastChild);
        }
    } else if (key === 'ArrowRight' || key === 'Enter') {
        if (activeElement !== sInput) {
            activeElement.click();
        }
    }
};
