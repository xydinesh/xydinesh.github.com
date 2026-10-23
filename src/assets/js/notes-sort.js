// Sort controls for /notes/. The server renders cards newest-first and the
// controls hidden; this script reveals them, applies ?sort=, and keeps the URL in sync.
(function () {
  var KEYS = ["finished", "title", "rating"];
  var DEFAULT = "finished";

  function parseSort(search) {
    var value = new URLSearchParams(search).get("sort");
    return KEYS.indexOf(value) === -1 ? DEFAULT : value;
  }

  function newestFirst(a, b) { return b.dataset.finished.localeCompare(a.dataset.finished); }

  // Ties always fall back to newest-finished, so a ?sort= link shows the same
  // order no matter how the cards were arranged before.
  var COMPARE = {
    finished: newestFirst,
    title: function (a, b) { return a.dataset.title.localeCompare(b.dataset.title) || newestFirst(a, b); },
    rating: function (a, b) { return Number(b.dataset.rating) - Number(a.dataset.rating) || newestFirst(a, b); },
  };

  function sortItems(items, key) {
    return items.slice().sort(COMPARE[key]);
  }

  function init() {
    var grid = document.getElementById("notes-grid");
    var controls = document.getElementById("notes-sort");
    if (!grid || !controls) return;
    var buttons = Array.prototype.slice.call(controls.querySelectorAll("button[data-sort]"));

    function apply(key, updateUrl) {
      sortItems(Array.prototype.slice.call(grid.children), key).forEach(function (li) {
        grid.appendChild(li);
      });
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.sort === key));
      });
      if (updateUrl) {
        var url = new URL(window.location.href);
        if (key === DEFAULT) url.searchParams.delete("sort");
        else url.searchParams.set("sort", key);
        history.replaceState(null, "", url);
      }
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.dataset.sort, true); });
    });
    controls.hidden = false;
    apply(parseSort(window.location.search), false);
  }

  if (typeof module === "object" && module.exports) {
    module.exports = { parseSort: parseSort, sortItems: sortItems };
  } else {
    init();
  }
})();
