# Printable report page

Shows a survey report that a dashboard packs into this page's address after the `#`.
That part of an address is never sent to a server, so this site stores and receives no survey data.
The report HTML is sanitized (DOMPurify) and the page's content security policy blocks all outside requests.
