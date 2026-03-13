(function () {
  function trimText(value, limit) {
    if (!value) return "";
    var normalized = String(value).replace(/\s+/g, " ").trim();
    if (normalized.length <= limit) return normalized;
    return normalized.slice(0, limit).trimEnd() + "...";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var modal = document.getElementById("searchModal");
    if (!modal) return;

    var panel = modal.querySelector(".search-modal-panel");
    var input = document.getElementById("searchModalInput");
    var results = document.getElementById("searchModalResults");
    var status = document.getElementById("searchModalStatus");
    var closeButton = document.getElementById("searchModalClose");
    var clearButton = document.getElementById("searchModalClear");
    var triggers = document.querySelectorAll(".header-search");
    var indexUrl = modal.dataset.indexUrl || "/index.json";

    var data = null;
    var fuse = null;
    var activeIndex = -1;
    var maxResults = 8;
    var isLoading = false;

    function setStatus(text) {
      status.textContent = text;
    }

    function setOpen(open) {
      modal.classList.toggle("is-open", open);
      modal.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.classList.toggle("search-modal-open", open);
      if (!open) activeIndex = -1;
    }

    function resetResults(message) {
      activeIndex = -1;
      results.innerHTML = "";
      setStatus(message || "输入关键词开始搜索。");
    }

    function ensureIndex() {
      if (data || isLoading) return;
      isLoading = true;
      setStatus("正在加载搜索索引...");

      fetch(indexUrl, { credentials: "same-origin" })
        .then(function (response) {
          if (!response.ok) throw new Error("index fetch failed");
          return response.json();
        })
        .then(function (json) {
          data = Array.isArray(json) ? json : [];
          if (window.Fuse) {
            fuse = new window.Fuse(data, {
              distance: 100,
              threshold: 0.35,
              ignoreLocation: true,
              keys: ["title", "summary", "content", "section", "categories", "tags"]
            });
          }
          resetResults("输入关键词开始搜索。");
        })
        .catch(function () {
          resetResults("搜索索引加载失败，请稍后重试。");
        })
        .finally(function () {
          isLoading = false;
        });
    }

    function fallbackSearch(query) {
      var q = query.toLowerCase();
      return (data || [])
        .map(function (item) {
          var title = (item.title || "").toLowerCase();
          var summary = (item.summary || "").toLowerCase();
          var content = (item.content || "").toLowerCase();
          var section = (item.section || "").toLowerCase();
          var score = 0;

          if (title.indexOf(q) !== -1) score += 6;
          if (summary.indexOf(q) !== -1) score += 4;
          if (section.indexOf(q) !== -1) score += 3;
          if (content.indexOf(q) !== -1) score += 1;

          return { item: item, score: score };
        })
        .filter(function (entry) {
          return entry.score > 0;
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .slice(0, maxResults);
    }

    function setActive(index) {
      var items = results.querySelectorAll(".search-modal-item");
      if (!items.length) {
        activeIndex = -1;
        return;
      }

      activeIndex = Math.max(0, Math.min(index, items.length - 1));
      items.forEach(function (item, currentIndex) {
        item.classList.toggle("is-active", currentIndex === activeIndex);
      });
    }

    function renderResults(items, query) {
      if (!items.length) {
        resetResults('没有找到和“' + query + '”相关的内容。');
        return;
      }

      results.innerHTML = items.map(function (entry, index) {
        var item = entry.item || entry;
        var summary = trimText(item.summary || item.content, 110);
        var section = trimText(item.section || (item.categories || []).join(" / ") || (item.tags || []).join(" / "), 28);

        return '<li class="search-modal-item" data-index="' + index + '">' +
          '<a class="search-modal-link" href="' + item.permalink + '">' +
          '<div class="search-modal-item-top">' +
          (section ? '<span class="search-modal-tag">' + section + '</span>' : '') +
          '<span class="search-modal-go" aria-hidden="true">↗</span>' +
          '</div>' +
          '<strong class="search-modal-title">' + item.title + '</strong>' +
          (summary ? '<p class="search-modal-summary">' + summary + '</p>' : '') +
          '</a></li>';
      }).join("");

      setStatus("找到 " + items.length + " 条结果。");
      setActive(0);
    }

    function performSearch() {
      var query = input.value.trim();
      if (!query) {
        resetResults("输入关键词开始搜索。");
        return;
      }

      if (!data) {
        setStatus("搜索索引加载中，请稍候。");
        ensureIndex();
        return;
      }

      var matches = fuse ? fuse.search(query, { limit: maxResults }) : fallbackSearch(query);
      renderResults(matches, query);
    }

    function openModal() {
      setOpen(true);
      ensureIndex();
      requestAnimationFrame(function () {
        input.focus();
        input.select();
      });
    }

    function closeModal() {
      setOpen(false);
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        openModal();
      });
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal || event.target.classList.contains("search-modal-backdrop")) {
        closeModal();
      }
    });

    panel.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    closeButton.addEventListener("click", closeModal);

    clearButton.addEventListener("click", function () {
      input.value = "";
      resetResults("输入关键词开始搜索。");
      input.focus();
    });

    input.addEventListener("input", performSearch);

    results.addEventListener("click", function (event) {
      if (event.target.closest(".search-modal-link")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      var key = event.key.toLowerCase();
      var target = event.target;
      var isTypingContext = target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      var isShortcut = (event.ctrlKey || event.metaKey) && key === "k";
      var isSlashShortcut = key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !isTypingContext;

      if (isShortcut || isSlashShortcut) {
        event.preventDefault();
        openModal();
        return;
      }

      if (!modal.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      var items = results.querySelectorAll(".search-modal-item");
      if (!items.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === "Enter" && document.activeElement === input && activeIndex >= 0) {
        event.preventDefault();
        var activeLink = items[activeIndex].querySelector(".search-modal-link");
        if (activeLink) activeLink.click();
      }
    });

    resetResults("输入关键词开始搜索。");
  });
})();
