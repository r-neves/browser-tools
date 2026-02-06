function createAnchorForJiraTicket() {
    const titleElems = document.getElementsByClassName("title");
    let mrTitle = undefined;

    for (let i = 0; i < titleElems.length; i++) {
        if (titleElems[i].tagName === 'H1') {
          mrTitle = titleElems[i];
            break;
        }
    }

    if (!mrTitle) {
        console.log('MR Title Element not found');
        console.log(titleElems);
        return;
    }

    const jiraTicketRegex = /\b([A-Z]+-[0-9]+)\b/g;
    const jiraTicket = mrTitle.textContent.match(jiraTicketRegex);
    if (!jiraTicket) {
      console.log('Jira Ticket not found in MR Title');
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = `https://obnewchannel.atlassian.net/browse/${jiraTicket[0]}`;
    anchor.innerText = jiraTicket[0];

    console.log('Injecting Jira Ticket Link');
    mrTitle.innerHTML = mrTitle.innerHTML.replace(jiraTicketRegex, anchor.outerHTML);
  }
  
  // Run the function when the page is loaded

  // NOTE: disabled since gitlab now handles this natively
  //window.addEventListener('load', createAnchorForJiraTicket);