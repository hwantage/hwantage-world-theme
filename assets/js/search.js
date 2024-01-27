const summaryInclude = 60;

function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  let regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  let results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

let searchQuery = getUrlParameter("q");

if (searchQuery) {
  document.getElementById("search-query").value = searchQuery;
  hangleSearch(searchQuery);
} else {
  document.getElementById("search-results").innerHTML =
    '<br/><p class="no-results">Please enter a word or phrase above</p><p class="no-results">한글 초성 검색을 지원합니다. <br/><br/>ㄱ글 => 구글, 가글, 고글 등이 검색 결과에 나타납니다.</p>';
}

function hangleSearch(searchQuery) {
  fetch("/index.json")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      let result = hanSearch(data, searchQuery); // 검색 수행
      if (result.length > 0) {
        document.getElementById("search-results").innerHTML = "";
        populateResults(result, searchQuery);
      } else {
        document.getElementById("search-results").innerHTML =
          '<br/><p class="no-results">No matches found</p><p class="no-results">한글 초성 검색을 지원합니다. <br/><br/>ㄱ글 => 구글, 가글, 고글 등이 검색 결과에 나타납니다.</p>';
      }
    });
}

function populateResults(result, userInput) {
  result.forEach(function (value, key) {
    if (value.type !== "posts") return;

    let contents = value.contents;
    let snippet = "";
    let snippetHighlights = [];
    snippetHighlights.push(userInput);
    if (snippet.length < 1) {
      const escapedSearch = userInput.replace(/[()|[\]{}\\]/g, ""); // 특수 문자 이스케이프
      var getSentenceByWordRegex = new RegExp(`[^.?!]*(?<=[.?\\s!])${escapedSearch}(?=[\\s.?!])[^.?!]*[.?!]`, "i");
      var maxTextLength = summaryInclude * 2;
      // Index of the matched search term
      var indexOfMatch = contents.toLowerCase().indexOf(userInput.toLowerCase());
      // Index of the first word of the sentence with the search term in it
      var indexOfSentence = contents.indexOf(getSentenceByWordRegex.exec(contents));

      var start;
      var cutStart = false;
      // Is the match in the result?
      if (indexOfSentence + maxTextLength < indexOfMatch) {
        // Make sure that the match is in the result
        start = indexOfMatch;
        // This bool is used to replace the first part with '...'
        cutStart = true;
      } else {
        // Match is in view, even if we show the whole sentence
        start = indexOfSentence;
      }

      // Change end length to the text length if it is longer than
      // the text length to prevent problems
      var end = start + maxTextLength;
      if (end > contents.length) {
        end = contents.length;
      }

      if (cutStart) {
        // Replace first three characters with '...'
        end -= 3;
        snippet += "…" + contents.substring(start, end).trim();
      } else {
        snippet += contents.substring(start, end).trim();
      }
    }
    snippet += "…";

    // Lifted from https://stackoverflow.com/posts/3700369/revisions
    var elem = document.createElement("textarea");
    elem.innerHTML = snippet;
    var decoded = elem.value;

    // Pull template from hugo template definition
    let frag = document.getElementById("search-result-template").content.cloneNode(true);
    // Replace values
    frag.querySelector(".search_summary").setAttribute("id", "summary-" + key);
    frag.querySelector(".search_link").setAttribute("href", value.permalink);
    frag.querySelector(".search_title").textContent = value.title;
    frag.querySelector(".search_snippet").textContent = decoded;
    let tags = value.tags;
    if (tags) {
      frag.querySelector(".search_tags").textContent = tags;
    } else {
      frag.querySelector(".search_iftags").remove();
    }
    let categories = value.categories;
    if (categories) {
      frag.querySelector(".search_categories").textContent = categories;
    } else {
      frag.querySelector(".search_ifcategories").remove();
    }
    snippetHighlights.forEach(function (snipvalue, snipkey) {
      let markjs = new Mark(frag);
      markjs.mark(snipvalue);
    });
    document.getElementById("search-results").appendChild(frag);
  });
}
