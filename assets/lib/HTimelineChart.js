// make global object
var HTimelineChart = {};
var timelineRightSpaceWidth = 180; // 오른쪽 차트 여백 더 주기

// options['ChartType']을 바인딩 하여 타입 별 챠트 생성
HTimelineChart.makeChart = function (contaner, options, data) {
  // 기존 챠트 destroy
  d3.select("#" + contaner)
    .selectAll("*")
    .remove();
  // 챠트 객체 return
  return HTimelineChart[options["ChartType"]](contaner, options, data);
};

// process tree
HTimelineChart.TimeLine = function (contaner, options) {
  var CHARTOBJ = this; // HTimelineCharts
  var TIMELINECHARTOBJ = CHARTOBJ.TimeLine; // HTimelineCharts.TimeLine
  var ChartData = options["ChartData"]; // chart data
  var ChartTitle = options["ChartTitle"]; // 타이틀 접미사
  var DateFormatType = options["DateFormatType"]; // 날짜 형식
  var TimeSkipInterval = options["TimeSkipInterval"]; // 노드와 노드사이 말줄임표 표시 기준
  var TimeSkipTickInterval = options["TimeSkipTickInterval"]; // 노드와 노드사이 말줄임표 표시 너비
  var TickInterval = options["TickInterval"]; // 노드 너비
  var ChartDataArr = [];

  // 챠트 관련 변수
  var StartDateTime = moment(ChartData[0].date); // 최초 이벤트 표시 날짜
  var currentDate = moment().format("YYYY-MM-DD HH:mm:ss.SSS"); // 챠트 생성 날짜

  // 컨테이너 생성
  var container = d3.select("#" + contaner);
  var chartContainer = container.append("div").attr("class", "timeline-chart-container");
  var timelineChart; // 챠트 오브젝트
  var timelineChartContents; // 노드 오브젝트 그룹핑
  var slider; // 스크롤바
  var timelineChartWidth; // 챠트 너비
  var timelineChartContentsWidth; // 노드 총 너비
  var handleWidth = 111; // 스크롤바 핸들러 너비
  var handleMinwidth = 20; // 스크롤바 핸들러 최소 너비
  var chartPadding = { top: 0, left: 85, right: 0, bottom: 0 };

  // 설정된 시간 공백 값 계산
  function getDiffTimeSkipInterval(prevObj, obj) {
    var a = moment(prevObj["date"]);
    var b = moment(obj["date"]);
    var diff = Math.abs(moment(a).diff(b));

    return diff > TimeSkipInterval;
  }

  // 노드 정렬
  function parseNodeData() {
    _.forEach(ChartData, function (node, i) {
      var targetNode = node;

      if (i > 1) {
        if (getDiffTimeSkipInterval(ChartData[i - 1], targetNode)) {
          targetNode["isLongTerm"] = true;
        }
      }
      // 기본일 경우
      if (DateFormatType == "normal") {
        targetNode["showDateStr"] = moment(targetNode["date"]).format("YYYY-MM-DD hh:mm:ss");
      }
      // before 일 경우
      else if (DateFormatType == "before") {
        targetNode["showDateStr"] = moment(moment(targetNode["date"])).from(currentDate, false);
      }
      // after일 경우
      else {
        if (i == 0) {
          targetNode["showDateStr"] = targetNode["date"];
        } else {
          targetNode["showDateStr"] = moment(moment(targetNode["date"])).from(StartDateTime, false);
        }
      }
      ChartDataArr.push(targetNode);
    });
  }

  // 값 기준 스크롤 위치 계산
  function getValueToPos(value) {
    return ((Number(timelineChartContentsWidth - timelineChartWidth) * Number(value)) / 100).toFixed(2);
  }

  // 위치 기준 스크롤 값 계산
  function getPosToValue(value) {
    return ((value - timelineChartWidth / 2) / Number(timelineChartContentsWidth - timelineChartWidth)) * 100;
  }

  // 챠트 너비 계산
  function getTotalWidth() {
    return ChartDataArr.length * TickInterval + (chartPadding.left + chartPadding.right);
  }

  // 노드 마우스 오버
  function nodeMouseOver(data) {
    //선택한 항목 식별 처리
    var isSelected = d3.select("#timelineNode-" + data["id"]).classed("selected");
    d3.selectAll(".node-ico").attr("src", defaultImgRoot + "circle-outline-shape.svg");
    d3.select("#timelineNode-" + data["id"] + " .node-ico").attr("src", defaultImgRoot + "circle-outline-shape-selected.svg");
    d3.selectAll(".node-wrapper.selected").classed("selected", false);
    d3.select("#timelineNode-" + data["id"]).classed("selected", true);
  }

  // 노드 클릭
  function nodeClick(data) {
    // 선택한 항목 새창 열기
    window.open(data["permalink"], "_blank");
  }

  // 노드생성
  function createNodes() {
    var nodeTotalDistance = 0;

    timelineChartContentsWidth = getTotalWidth(); // 챠트 너비
    makeChartContainer(); // 컨테이너 생성
    makeChartTitle(); // 타이틀 생성

    // 노드생성
    var nodeWrapper = timelineChartContents
      .selectAll("div.node-wrapper")
      .data(ChartDataArr)
      .enter()
      .append("div")
      .attr("id", function (data, i) {
        return "timelineNode-" + data.id;
      })
      .attr("class", function (data, i) {
        if (i % 2 == 0) {
          return "node-wrapper long";
        } else {
          return "node-wrapper";
        }
      })
      .style("width", function (data, i) {
        if (i < ChartDataArr.length - 1) {
          return TickInterval * 2 + "px";
        } else {
          return TickInterval + chartPadding["right"] + "px"; // 마지막인경우 너비가 더 작음
        }
      })
      .style("left", function (data, i) {
        if (i > 0) {
          if (data.isLongTerm) {
            nodeTotalDistance = nodeTotalDistance + TimeSkipTickInterval;
            return nodeTotalDistance + "px";
          } else {
            nodeTotalDistance = nodeTotalDistance + TickInterval;
            return nodeTotalDistance + "px";
          }
        }
        // 첫번째 노드
        else {
          nodeTotalDistance += chartPadding["left"];
          return nodeTotalDistance + "px";
        }
      })
      // TimeSkipTick 생성
      .each(function (data, i) {
        if (ChartDataArr[i + 1] && ChartDataArr[i + 1]["isLongTerm"]) {
          makeTimeSkipTick(this, data, nodeTotalDistance);
        }
      });

    // y 라인 생성
    nodeWrapper.append("div").attr("class", function (data, i) {
      if (i % 2 == 0) {
        return "tick-y-axis-line long";
      } else {
        return "tick-y-axis-line";
      }
    });

    // 카테고리 표기
    nodeWrapper
      .append("div")
      .attr("class", function (data, i) {
        return "status-ico";
      })
      .html(function (data) {
        if (data["Category"] != "") {
          return "<img src=" + defaultImgRoot + "flag.png width=30 align=top>" + data["category"];
        }
      });

    // text 생성
    nodeWrapper
      .append("div")
      .attr("class", "node-info")
      .attr("title", function (data) {
        if (data["showDateStr"] != "Invalid date") return data["showDateStr"];
      })
      .html(function (data) {
        if (data["showDateStr"] != "Invalid date")
          return moment(moment(data["showDateStr"])).from(currentDate, false) + "<br><span class='title-text'>" + data["title"] + "</span>";
        else return null;
      })
      .on("mouseover", nodeMouseOver)
      .on("click", nodeClick);

    // icon 생성
    nodeWrapper
      .append("img")
      .attr("class", "node-ico")
      .attr("src", function (data) {
        var _src = defaultImgRoot + "circle-outline-shape.svg";
        var img = new Image();
        var el = this;
        img.addEventListener("load", function () {
          d3.select(el).style({
            width: this.naturalWidth + "px",
            height: this.naturalHeight + "px",
            //bottom: "-" + this.naturalHeight / 2 + "px",
            bottom: "71px",
            left: "-" + this.naturalWidth / 2 + "px",
          });
        });
        img.src = _src;
        return _src;
      })
      .on("mouseover", nodeMouseOver)
      .on("click", nodeClick);

    timelineChartContentsWidth = nodeTotalDistance + TickInterval + timelineRightSpaceWidth;
    timelineChartContents.style("width", timelineChartContentsWidth + "px");

    timelineChartContents
      .append("div")
      .attr("class", "tick-x-axis-line")
      .style("width", timelineChartContentsWidth + "px");

    if (timelineChartContentsWidth > timelineChartWidth) {
      makeScrollbar(); // 컨텐츠 너비가 더 클 경우 스크롤바 생성
    }
  }

  // 시간 공백 노드 생성
  function makeTimeSkipTick(el, d) {
    d3.select(el)
      .append("div")
      .attr("class", "node-time-skip-tick")
      .style("width", TimeSkipTickInterval + "px")
      .html(function (data) {
        var html = moment(moment(ChartDataArr[parseInt(data.id) + 1]["date"])).from(data.date, true);
        html += '<br><span class="ico"></span><span class="ico"></span><span class="ico"></span>';
        return html;
      });
  }

  // 타이틀 생성
  function makeChartTitle() {
    chartContainer.append("div").attr("class", "timeline-chart-title").text(ChartTitle);
  }

  // 챠트 컨테이너 생성
  function makeChartContainer() {
    timelineChart = chartContainer
      .append("div")
      .attr("id", "timelineChart")
      .on("wheel", function (data) {
        var oldPos = Number(slider.node().noUiSlider.get());
        if (d3.event.wheelDelta > 0) {
          slider.node().noUiSlider.set(oldPos + (d3.event.wheelDelta + (handleWidth * 100) / 100) / 100);
        } else {
          slider.node().noUiSlider.set(oldPos + (d3.event.wheelDelta + -((handleWidth * 100) / 100)) / 100);
        }
      });

    timelineChartContents = timelineChart
      .append("div")
      .attr("class", "timelineChartContents")
      .style("width", timelineChartContentsWidth + "px");

    timelineChartWidth = timelineChart.node().getBoundingClientRect().width;
  }

  // 커스텀 스크롤 생성
  function makeScrollbar() {
    // 기본 핸들러의 사이즈에서 컨텐츠 너비의 1.5배율로 사이즈를 조정 한다.
    handleWidth = (handleWidth * ((timelineChartWidth / (timelineChartContentsWidth - timelineChartWidth)) * 100)) / 100;
    // 최소사이즈 적용
    if (handleWidth < handleMinwidth) {
      handleWidth = handleMinwidth;
    } else if (handleWidth > timelineChartWidth) {
      handleWidth = timelineChartWidth - 10;
    }
    slider = chartContainer
      .append("div")
      .attr("class", "costom-scrollbar-wrapper")
      .style("left", handleWidth + "px")
      .append("div")
      .attr("id", "TimelineSlider")
      .attr("class", "costom-scrollbar");

    noUiSlider.create(slider.node(), {
      start: 0,
      step: 0.1,
      animate: false,
      connect: false,
      range: {
        min: 0,
        max: 100,
      },
    });

    d3.select(".noUi-base")
      .append("div")
      .attr("class", "slider-track-bg")
      .style({
        left: "-" + handleWidth + "px",
        "padding-left": handleWidth + "px",
      });

    d3.select(".noUi-horizontal .noUi-handle")
      .style("width", handleWidth + "px")
      .append("div")
      .attr("class", "noUi-handleIcon");

    // 스크롤 이벤트 바인딩
    slider.node().noUiSlider.on("update", function (values) {
      timelineChartContents.style("left", "-" + getValueToPos(values[0]) + "px");
    });
  }

  // 노드 포커싱
  TIMELINECHARTOBJ["scrollToTarget"] = function (id) {
    var pos = parseInt(d3.select("#timelineNode-" + id).style("left"));
    slider.node().noUiSlider.set(getPosToValue(pos));
    d3.select("#timelineNode-" + id + " .node-ico").node();
  };

  // 챠트 초기화
  function init() {
    parseNodeData(); // 노드 데이터 정리
    createNodes(); // 노드생성
    // 챠트 생성 콜백
    options.Onload && options.Onload(chartContainer);
  }

  init();

  // 좌우 마우스 드래그로 스크롤 가능하도록 이벤트 추가
  var isMouseDown = false;
  var startX, scrollLeft;
  var timelineWrapper = document.getElementsByClassName("timelineChartContents")[0];

  timelineWrapper.addEventListener("mousedown", function (e) {
    isMouseDown = true;
    e.preventDefault();
    startX = e.pageX - timelineWrapper.offsetLeft;
    scrollLeft = timelineWrapper.scrollLeft;
  });

  timelineWrapper.addEventListener(
    "mouseup",
    function (e) {
      var nodeInfoDiv = document.querySelector(".node-info");
      isMouseDown = false;
      e.stopPropagation();
      e.preventDefault();
    },
    false
  );

  timelineWrapper.addEventListener("mouseleave", function (e) {
    isMouseDown = false;
    e.preventDefault();
  });

  timelineWrapper.addEventListener("mousemove", function (e) {
    if (!isMouseDown) return;
    e.preventDefault();
    var x = e.pageX - timelineWrapper.offsetLeft;
    var walk = (x - startX) * 0.1; // Adjust the scroll speed

    // 기존 scrollLeft에서 마우스 이동에 따라 움직인 만큼만 이동하도록 조정
    var newScrollLeft = scrollLeft - walk;
    var totalWidth = timelineWrapper.scrollWidth;

    // slider의 현재 값 가져오기
    var oldPos = parseFloat(slider.node().noUiSlider.get());
    var newPos = ((newScrollLeft - scrollLeft) / totalWidth) * 100;

    // 새로운 값을 설정할 때 기존의 포지션과의 차이만큼만 설정
    slider.node().noUiSlider.set(oldPos + newPos);

    // 새로운 scrollLeft 값으로 업데이트
    scrollLeft = newScrollLeft;
  });

  return TIMELINECHARTOBJ;
};
