  function loadTerminal(){
    var scriptElement = document.createElement("script");
    scriptElement.src = "/js/xterm.js";
    scriptElement.type = "text/javascript";
    document.head.appendChild(scriptElement);

    scriptElement.onload = function () {
      console.log("xterm.js has been loaded!");
	  initTerminal();
    }
  }

  /* https://codepen.io/alvarotrigo/pen/gOvpwxJ */
  let currentInput = "";
  let isMenuMode = false;
  var term = null;
  var terminal = document.getElementById("terminal");

  var onKeyHandler = (e) => {
    // 이벤트 핸들러의 내용
    if (e.key === "\r") {
      if (currentInput === "post") {
        isMenuMode = true;
        term.write("\r\n");
        term.write("\r\n \x1b[33m블로그 포스트 목록을 출력합니다... 번호를 입력하면 내용을 보실 수 있습니다.\x1b[0m");
        term.write("\r\n");
        fetch("https://hwantage.github.io/index.xml")
          .then((response) => response.text())
          .then((xmlContent) => {
            // Parse XML content
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
            const items = xmlDoc.getElementsByTagName("item");

            // Display titles with index
            for (let i = 0; i < items.length; i++) {
              term.write(` ${i + 1}. ${items[i].getElementsByTagName("title")[0].textContent}\r\n`);
            }

            term.write("\x1b[0m Enter the number: ");
            currentInput = "";
          })
          .catch((error) => {
            console.error(" Error fetching XML content:", error);
            term.write("\r\n\x1b[31m Error fetching XML content.\x1b[0m\r\nHwantage world $ ");
            currentInput = "";
          });
        currentInput = "";
      }
      if (isMenuMode) {
        handleMenuSelection(currentInput);
      } else {
        handleInput(currentInput);
        currentInput = ""; // Clear the input buffer
        term.write("\x1b[0m");
        term.write("\r\n"); // Move the cursor to the next line and display the prompt
        term.write(" Hwantage world $ "); // Display the prompt
      }
    } else if (e.key === "\x7F") {
      // Backspace key
      if (currentInput.length > 0) {
        term.write("\b \b"); // Move the cursor back, overwrite the character, move the cursor back again
        currentInput = currentInput.slice(0, -1);
      }
    } else {
      term.write(e.key);
      currentInput += e.key;
    }
  };

  function disposeTerminal() {
    try {
      terminal.innerHTML = "";
      term.dispose();
    } catch (e) {}
  }

  function initTerminal() {
  
    // 상단 레이어 슬라이드 다운
	var termContent = document.querySelector('.terminal-content');
    termContent.classList.toggle('showTerm');
    termContent.classList.toggle('hideTerm');
    termContent.classList.remove('hidden');
	
    disposeTerminal();

    term = new Terminal({
      theme: {
        background: "#1E1E1E", // 배경색
        foreground: "#CCCCCC", // 전경색
      },
      fontFamily: "monospace, Source Serif Pro, Open Sans", // 폰트
      cursorBlink: true, // 커서 깜빡임 활성화
      cursorStyle: "block", // 커서 스타일을 블록으로 설정
      convertEol: true, // 개행문자 변환 활성화
      rows: 24, // 높이 (줄 수)
      cols: 120, // 넓이 (컬럼 수)
    });

    term.open(terminal);

    term.write(" Welcome! \x1b[47m\x1b[31m\x1b[1m hwantage world \x1b[0m 에 오신것을 환영합니다. ");
    term.write("\r\n");
    term.write("\r\n\x1b[34m Xterm.js 를 이용한 fake terminal 입니다.\x1b[0m");
    term.write("\r\n");
    term.write("\r\n\x1b[33m 사용할 수 있는 명령어 확인을 위해 '\x1b[1mhelp\x1b[0m\x1b[33m' 를 입력해 주세요.\x1b[0m");
    term.write("\r\n");
    term.write("\r\n");
    term.write(" hwantage world $ ");

    term.onKey(onKeyHandler);
    term.focus();
  }

  function handleInput(input) {
    switch (input.trim()) {
      case "help":
        printCommand();
        break;
      case "info":
        typeInfoWithDelay(1);
        break;
      case "blog":
        term.writeln("\r\n\x1b[36m Opening blog...\x1b[0m");
        window.open("https://hwantage.github.io/", "_blank");
        break;
      case "git":
        term.writeln("\r\n\x1b[35m Accessing Git repository...\x1b[0m");
        window.open("https://github.com/hwantage", "_blank");
        break;
      case "exit":
        term.writeln("\r\n\x1b[31m Goodbye!\x1b[0m");
        setTimeout(function () {
          disposeTerminal();
        }, 2000);
        break;
      default:
        term.writeln("\r\n\x1b[33m Command not found. Type '\x1b[1mhelp\x1b[0m\x1b[33m' for a list of commands.\x1b[0m");
        break;
    }
  }

  function handleMenuSelection(selection) {
    if (selection === "help") {
      printCommand();
      term.write("\r\n");
      term.write(" hwantage world $ ");
      currentInput = "";
      isMenuMode = false;
      return;
    } else if (selection.trim() === "") {
      currentInput = "";
      return;
    }
    const index = parseInt(selection, 10);
    console.log(index);
    if (!isNaN(index) && index > 0) {
      fetch("https://hwantage.github.io/index.xml")
        .then((response) => response.text())
        .then((xmlContent) => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
          const items = xmlDoc.getElementsByTagName("item");

          // Check if the selected index is valid
          if (index <= items.length) {
            const link = items[index - 1].getElementsByTagName("link")[0].textContent;
            term.write("\r\n");
            term.writeln(` Opening: ${link}`);
            window.open(link, "_blank");
            term.write("\x1b[0m Enter the number: ");
          } else {
            term.writeln(`\r\n\x1b[31m Invalid number selection. Please enter a number between 1 and ${items.length}.\x1b[0m`);
            term.write("\x1b[0m Enter the number: ");
          }
          currentInput = "";
        })
        .catch((error) => {
          console.error(" Error fetching XML content:", error);
          term.write("\r\n\x1b[31m Error fetching XML content.\x1b[0m\r\nHwantage world $ ");
          currentInput = "";
        });
    } else if (isNaN(index)) {
      term.writeln("\r\n\x1b[33m Command not found. Type '\x1b[1mhelp\x1b[0m\x1b[33m' for a list of commands.\x1b[0m");
      term.write("\x1b[0m Enter the number: ");
      currentInput = "";
    } else {
      term.write("\x1b[0m Enter the number: ");
    }
  }

  function printCommand() {
    term.writeln("\r\n\x1b[32m 명령어 목록: ");
    term.writeln("\x1b[33m\x1b[1m help \x1b[0m: 사용 가능한 명령어 목록을 제공합니다.");
    term.writeln("\x1b[33m\x1b[1m info \x1b[0m: 프로그램 제작자에 대한 정보를 출력합니다.");
    term.writeln("\x1b[33m\x1b[1m post \x1b[0m: 최신 블로그 글 목록을 출력합니다. 선택해서 내용을 확인할 수 있습니다.");
    term.writeln("\x1b[33m\x1b[1m blog \x1b[0m: 블로그로 이동합니다.(새창)");
    term.writeln("\x1b[33m\x1b[1m git \x1b[0m : git 홈으로 이동합니다.(새창)");
    term.writeln("\x1b[33m\x1b[1m exit \x1b[0m: 터미널을 종료합니다.");
  }

  function typeInfoWithDelay(delay) {
    let index = 0;
    const text = `
    {
      name: 'jung hwan' | 'Kim',
      email: 'hwantagexsw2@gmail.com',
      blog: 'https://hwantage.github.io',
      git: 'https://github.com/hwantage',
      keywords: ['Web Dev', 'Front-end', 'Back-end', 'UX', 'Team manager'],
      technologies: {
        languages: [
          'C', 'Visual Basic', 'Python', 'Java',
          'C#', 'JavaScript', 'TypeScript', 'Go', 'Bash',
          'SQL', 'HTML', 'CSS', 'PHP', 'ASP', 'ASP.NET','JSP',
        ],
        web: [
          'React', 'Vue.js', 'Express.js', 'Node.js', 'jQuery', 
          'WebPack', 'Babel', 'Axios', 'Bootstrap', 'Materialize CSS',
          'WordPress', 'Spring MVC', 'ASP.NET Core', 'ASP.NET MVC',
        ],
        databases: [
          'PostgreSQL', 'MariaDB/MySQL', 'PL/SQL',
          'MongoDB', 'Cloud Firestore', 'SQLite',
          'ORACLE', 'MySQL', 'MS Access',
        ],
        applications: ['Adobe CC', 'Microsoft Office'],
        mathematicsAndStatistics: ['R'],
        machineLearning: ['Tensorflow'],
        toolchains: ['NPM', 'Yarn', 'Docker', 'Kubernetes'],
        devOps: ['Git', 'Jenkins CI', 'Redmine', 'Nexus', 'Gitlab CI', 'SVN'],
        cloudOps: ['AWS', 'Azure', 'Firebase'],
        operatingSystems: ['GNU/Linux', 'BSD', 'Unix', 'Windows'],
        architectures: ['Serverless', 'Microservices', 'Monolithic'],
        mobile: ['Android', 'Flutter', 'Firebase'],
        editors: ['VSCode', 'ViM', 'Visual Studio.Net', 'Nodepad'],
      },
      Education: [
        'Dong-buk high school',
        'KunKuk University Bachelor of Science',
        'Yonsei University Master of Science',
      ]
    }
    
 hwantage world $ `;
    const intervalId = setInterval(() => {
      if (index === 0) term.writeln("\r\n\x1b[34m Displaying information...\x1b[0m");
      if (index < text.length) {
        term.write(text[index]);
        index++;
      } else {
        clearInterval(intervalId);
      }
    }, delay);
  }