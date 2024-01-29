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
      const result = hansearch(data, searchQuery).mark("mark"); // 검색 수행
	  
      if (result.items.length > 0) {
        document.getElementById("search-results").innerHTML = "";
        makeHtmlResults(result.items, searchQuery);
      } else {
        document.getElementById("search-results").innerHTML =
          '<br/><p class="no-results">No matches found</p><p class="no-results">한글 초성 검색을 지원합니다. <br/><br/>ㄱ글 => 구글, 가글, 고글 등이 검색 결과에 나타납니다.</p>';
      }
    });
}

function makeHtmlResults(result, userInput) {
  result.forEach(function (value, key) {
    if (value.type !== "posts") return;

    let contents = value.contents;
	let snippet = "";
	let indexOfSentence = -1;
    if (snippet.length < 1) {
	  var getSentenceByWordRegex = /<mark>(.*?)<\/mark>/g;
      var maxTextLength = summaryInclude * 2;
      // Index of the first word of the sentence with the search term in it
	  var match = getSentenceByWordRegex.exec(contents);

	  if (match) {
		indexOfSentence = contents.indexOf(match[0]);
	  }

      var start;
      var cutStart = false;
      // Is the match in the result?
      if (indexOfSentence > summaryInclude) {
        // This bool is used to replace the first part with '...'
		start = indexOfSentence - summaryInclude;
        cutStart = true;
      } else {
		  start = indexOfSentence - summaryInclude;
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

    var elem = document.createElement("textarea");
    elem.innerHTML = snippet;
    var decoded = elem.value;

    // Pull template from hugo template definition
    let frag = document.getElementById("search-result-template").content.cloneNode(true);
    // Replace values
    frag.querySelector(".search_summary").setAttribute("id", "summary-" + key);
    frag.querySelector(".search_link").setAttribute("href", value.permalink);
    frag.querySelector(".search_title").innerHTML = value.title;
    frag.querySelector(".search_snippet").innerHTML = decoded;
    let tags = value.tags;
    if (tags) {
      frag.querySelector(".search_tags").innerHTML = tags;
    } else {
      frag.querySelector(".search_iftags").remove();
    }
    let categories = value.categories;
    if (categories) {
      frag.querySelector(".search_categories").innerHTML = categories;
    } else {
      frag.querySelector(".search_ifcategories").remove();
    }
    document.getElementById("search-results").appendChild(frag);
  });
}
