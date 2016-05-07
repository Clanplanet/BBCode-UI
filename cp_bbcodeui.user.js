// ==UserScript==
// @name           Cp BBCodeUI
// @namespace      Code Infection
// @description    BBCode-Oberfläche für das Clanplanet-Forum
// @include        http://clanplanet.de*
// @include        https://clanplanet.de*
// @include        http://www.clanplanet.de*
// @include        https://www.clanplanet.de*
// ==/UserScript==


/*
 *  Version
 */
const VERSION = '1.3.1';

/*
 *  AJAX
 */
function createRequest()
{
    var request = false;
    try
    {
        request = new XMLHttpRequest();
    }
    catch (ex)
    {
        try
        {
            request = new ActiveXObject("Msxml2.XMLHTTP");
        } 
        catch (ex2)
        {
            try
            {
                request = new ActiveXObject("Microsoft.XMLHTTP");
            } 
            catch (ex3)
            {}
        }  
    }
    return request;
}
function ajax_get(request, url, callback)
{
    request.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            callback(this);
        }
    };
    request.open('GET', url);
    request.send(null);
}
function GM_GET(url, callback)
{
    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      onload: callback
    });
}

/*
 *  Cookies
 */
function createCookie (name, value, days)
{
    var expires;
    if (days)
    {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toGMTString();
    }
    else
    {
        expires = '';
    }
    document.cookie = name + '=' + value + expires + '; path=/';
}

function readCookie(name)
{
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++)
    {
        var c = ca[i];
        while (c.charAt(0)==' ')
        {
            c = c.substring(1,c.length);
        }
        if (c.indexOf(nameEQ) == 0)
        {
            return c.substring(nameEQ.length,c.length);
        }
    }
    return null;
}

function eraseCookie(name)
{
    createCookie(name, '', -1);
}


/*
 *  Daten
 */

var buttons = {
    'mark':
    {
        'style': {
            'backgroundColor': '#FFF',
            'border': '1px solid black'
        },
        'id': null,
        'text': '<span class="mark">Markierung</span>',
        'onclick': function() {
            insertBBCode('ci_BBCode_input', 'mark');
        },
        'onmouseover': null,
        'onmouseout': null
    },
    'url':
    {
        'style': {
            'backgroundColor': '#FFF',
            'border': '1px solid black'
        },
        'id': 'bbcodeui_link',
        'text': '<a name="link" style="color:black;text-decoration:none">Link</a>',
        'onclick': function() {
            insertURLBBCode('ci_BBCode_input');
        },
        'onmouseover': function() {
            document.getElementById('bbcodeui_link').getElementsByTagName('a')[0].style.textDecoration = 'underline';
        },
        'onmouseout': function() {
            document.getElementById('bbcodeui_link').getElementsByTagName('a')[0].style.textDecoration = 'none';
        }
    },
    'img':
    {
        'style': {
            'backgroundColor': '#FFF',
            'border': '1px solid black'
        },
        'id': null,
        'text': 'Bild',
        'onclick': function() {
            insertImgBBCode('ci_BBCode_input');
        },
        'onmouseover': null,
        'onmouseout': null
    },
    'email':
    {
        'style': {
            'backgroundColor': '#FFF',
            'border': '1px solid black'
        },
        'id': null,
        'text': 'Em@il',
        'onclick': function() {
            insertBBCode('ci_BBCode_input', 'email');
        },
        'onmouseover': null,
        'onmouseout': null
    },
    'b':
    {
        'style': {
            'backgroundColor': '#FFF',
            'border': '1px solid black'
        },
        'id': null,
        'text': '<strong>Fett</strong>',
        'onclick': function() {
            insertBBCode('ci_BBCode_input', 'b');
        },
        'onmouseover': null,
        'onmouseout': null
    },
    'i':
    {
        'style': {
            'backgroundColor': '#FFF',
            'border': '1px solid black'
        },
        'id': null,
        'text': '<em>Kursiv</em>',
        'onclick': function() {
            insertBBCode('ci_BBCode_input', 'i');
        },
        'onmouseover': null,
        'onmouseout': null
    },
    'quote':
    {
        'style': {
            'backgroundColor': '#FFF',
            'border': '1px solid black'
        },
        'id': null,
        'text': '„Zitat“',
        'onclick': function() {
            insertBBCode('ci_BBCode_input', 'quote');
        },
        'onmouseover': null,
        'onmouseout': null
    },
    'list':
    {
        'style': {
            'backgroundColor': '#FFF',
            'border': '1px solid black'
        },
        'id': null,
        'text': '• Liste',
        'onclick': function() {
            insertListBBCode('ci_BBCode_input');
        },
        'onmouseover': null,
        'onmouseout': null
    },
    'center':
    {
        'style': {
            'backgroundColor': '#FFF',
            'border': '1px solid black'
        },
        'id': null,
        'text': 'Zentriert',
        'onclick': function() {
            insertBBCode('ci_BBCode_input', 'center');
        },
        'onmouseover': null,
        'onmouseout': null
    },
    'html':
    {
        'style': {
            'backgroundColor': '#FFF',
            'border': '1px solid black'
        },
        'id': null,
        'text': '&lt;HTML&gt;',
        'onclick': function() {
            insertBBCode('ci_BBCode_input', 'html');
        },
        'onmouseover': null,
        'onmouseout': null
    }
};

/*
 *  BBCode-Funktion
 */
function simple_insert(input,aTag,eTag)
{
    input.focus();
    var insText;
    if(typeof document.selection != 'undefined')
    {
        var range = document.selection.createRange();
        insText = range.text;
        range.text = aTag + insText + eTag;
        range = document.selection.createRange();
        if (insText.length === 0)
        {
            range.move('character', -eTag.length);
        }
        else
        {
            range.moveStart('character', aTag.length + insText.length + eTag.length);
        }
        range.select();
    }
    else if(typeof input.selectionStart != 'undefined')
    {
        var start = input.selectionStart;
        var end = input.selectionEnd;
        insText = input.value.substring(start, end);
        input.value = input.value.substr(0, start) + aTag + insText + eTag + input.value.substr(end);
        var pos;
        if (insText.length === 0)
        {
            pos = start + aTag.length;
        }
        else
        {
            pos = start + aTag.length + insText.length + eTag.length;
        }
        input.selectionStart = pos;
        input.selectionEnd = pos;
    }
    else
    {
        input.value += aTag + eTag;
    }
    return false;
}

function insertBBCode(inputID, name, attrib)
{
    var input = document.getElementById(inputID);
    var startTag = '[' + name + (attrib ? '=' + attrib : '') + ']';
    var endTag = '[/' + name + ']';
    simple_insert(input, startTag, endTag);
    return false;
}
function insertSingleBBCode(inputID, name)
{
    var input = document.getElementById(inputID);
    var endTag = '[' + name + ']';
    simple_insert(input, '', endTag);
    return false;
}
function insertURLBBCode(inputID)
{
    var input = document.getElementById(inputID);
    var uri = window.prompt('Gib den Link ein', '');
    if (!uri)
    {
        return false;
    }
    if (uri.search(/^[a-z0-9]+:\/\//i)  < 0)
    {
        uri = 'http://' + uri;
    }
    var title = window.prompt('Gib den Titel ein', '');
    var startTag = '';
    if (!title)
    {
        startTag = '[url]' + uri + '[/url]';
    }
    else
    {
        startTag = '[url=' + uri + ']' + title + '[/url]';
    }
    simple_insert(input, startTag, '');
    return false;
}
function insertImgBBCode(inputID)
{
    var input = document.getElementById(inputID);
    var uri = window.prompt('Gib die Adresse des Bildes an', '');
    var startTag = '';
    if (uri)
    {
        if (uri.search(/^[a-z0-9]+:\/\//i)  < 0)
        {
            uri = 'http://' + uri;
        }
        startTag = '[img]' + uri + '[/img]';
    }
    simple_insert(input, startTag, '');
    return false;
}
function insertListBBCode(inputID)
{
    var input = document.getElementById(inputID);
    var listItems = '';
    var tmp = '';
    while ((tmp = window.prompt('Gib den Inhalt für ein Listenpunkt ein', '')))
    {
        listItems += '[*]' + tmp + '\n';
    }
    var startTag = '';
    if (listItems)
    {
        startTag = '[list]\n' + listItems + '[/list]';
    }
    simple_insert(input, startTag, '');

    return false;
}
/*
 *  MISC
 */
function absoluteOffsetTop(node)
{
    var pos = 0;
    if (node.offsetParent)
    {
        while (node.offsetParent)
        {
            pos += node.offsetTop;
            node = node.offsetParent;
        }
    }
    else if (node.y)
    {
        pos = node.y;
    }
    return pos;
}
function absoluteOffsetLeft(node)
{
    var pos = 0;
    if (node.offsetParent)
    {
        while (node.offsetParent)
        {
            pos += node.offsetLeft;
            node = node.offsetParent;
        }
    }
    else if (node.x)
    {
        pos = node.x;
    }
    return pos;
}
function deleteNode(node)
{
    node.parentNode.removeChild(node);
}
function swapStyle(node, prop, value1, value2)
{
    if (node.style[prop] == value1)
    {
        node.style[prop] = value2;
    }
    else
    {
        node.style[prop] = value1;
    }
}
function setStyles(elem, styles)
{
    for (var index in styles)
    {
        elem.style[index] = styles[index];
    }
}
function bindEvent(elem, event, handler)
{
    if (elem.addEventListener)
    {
        elem.addEventListener(event, handler, false);
    }
    else if (elem.attachEvent)
    {
        elem.attachEvent('on' + event, handler);
    }
}
function unbindEvent(elem, event, handler)
{
    if (elem.addEventListener)
    {
        elem.removeEventListener(event, handler, false);
    }
    else if (elem.attachEvent)
    {
        elem.detachEvent('on' + event, handler)
    }
}
function cancelEvent(e)
{
    if (e.preventDefault)
    {
        e.preventDefault();
    }
    else
    {
        e.returnValue = false;
    }
}
function in_array(needle, haystack, argStrict)
{
    var key = '', strict = !!argStrict; 
    if (strict)
    {
        for (key in haystack)
        {
            if (haystack[key] === needle)
            {
                return true;
            }
        }
    }
    else
    {
        for (key in haystack)
        {
            if (haystack[key] == needle)
            {
                return true;
            }
        }
    }
    return false;
}
function trim(string)
{
    return string.replace(/^\s+/, '').replace(/\s+$/, '0');
}
function errorMessage(headline, text)
{
    var excepBox = document.createElement('div');
    excepBox.style.position = 'absolute';
    excepBox.style.top = '0';
    excepBox.style.left = '0';
    excepBox.style.margin = '10px';
    excepBox.style.padding = '4px';
    excepBox.style.border = '1px solid red';
    excepBox.style.overflow = 'hidden';
    excepBox.style.background = 'white';
    excepBox.style.color = 'black';
    bindEvent(excepBox, 'dblclick', function(){deleteNode(this);});
    excepBox.innerHTML = '<h1 style="color:red">'
                       + headline
                       + ' (Doppelklicke zum Schließen)</h1>'
                       + text
                       + '<hr />Current Page: '
                       + document.location.href
                       + '<br />Browser: '
                       + navigator.appName
                       + ' [' + navigator.appCodeName + '] @ '
                       + navigator.platform
                       + '<br />User-Agent: '
                       + navigator.userAgent
                       + '<br />Script-Version: '
                       + VERSION;
                       + '<div style="font-weight:bold">Diese Meldung wurde vom BBCode-Addon generiert, nicht von Clanplanet selbst!</div>'
    document.body.appendChild(excepBox);
}
function openPopupWindow(url, width, height, scrollbars)
{
    var win = open(url,'cp','toolbar=no,width=' + width + ',height=' + height + ',directories=no,status=yes,scrollbars=' + (scrollbars ? 'yes' : 'no') + ',menubar=no')
    win.focus();
}

/*
 *  String-Verarbeitung
 */
function str_replace(search, replace, subject)
{
    return subject.split(search).join(replace);
}
function stringContains(string, pattern)
{
    return (string.search(new RegExp(regex_quote(pattern))) > -1);
}
function isDefined(target)
{
    return (typeof target !== 'undefined');
}
function strip_tags(input, allowed)
{
   allowed = (((allowed || "") + "")
        .toLowerCase()
        .match(/<[a-z][a-z0-9]*>/g) || [])
        .join('');
   var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
   commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
   return input.replace(commentsAndPhpTags, '').replace(tags, function($0, $1){
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
   });
}
/*
 *  Regex-Helfer
 */
function regex_replace_callback(pattern, callback, subject)
{
    return subject.replace(pattern, function(match){
        match = match.match(pattern);
        return callback(match);
    });
}
function regex_quote(str, delimiter)
{
    return (str+'').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\'+(delimiter || '')+'-]', 'g'), '\\$&');
}
/*
 *  Url-CodEc
 */
function rawurlencode(str)
{
    str = (str+'').toString();
    return encodeURIComponent(str).
                                replace(/!/g,  '%21').
                                replace(/'/g,  '%27').
                                replace(/\(/g, '%28').
                                replace(/\)/g, '%29').
                                replace(/\*/g, '%2A').
                                replace(/~/g,  '%7E');
}
function rawurldecode(str)
{
    return decodeURIComponent(str);
}


function createBBCodeButton(data)
{
    button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = data.text;
    if (data.id !== null)
    {
        button.id = data.id;
    }
    
    setStyles(button, data.style);
    bindEvent(button, 'click', function(e){
        data.onclick(e);
        cancelEvent(e);
    });
    if (data.onmouseover !== null)
    {
        bindEvent(button, 'mouseover', data.onmouseover);
    }
    if (data.onmouseout !== null)
    {
        bindEvent(button, 'mouseout', data.onmouseout);
    }
    
    return button;
}

function buildBBCodeUI(node, Buttons)
{
    var buttonData;
    if (isDefined(Buttons))
    {
        for (var index in Buttons)
        {
            buttonData = buttons[Buttons[index]];
            if (!isDefined(buttonData))
            {
                continue;
            }
            node.appendChild(createBBCodeButton(buttonData));
        }
    }
    else
    {
        for (index in buttons)
        {
            buttonData = buttons[index];
            node.appendChild(createBBCodeButton(buttonData));
        }
    }
}

function attachMenu(form, textarea, boxStyles, menuButtons)
{
    var box = document.createElement('div');
    box.id = 'ci_bbcode';
    setStyles(box, boxStyles);
    buildBBCodeUI(box, menuButtons);
    
    if (typeof form == 'number')
    {
        form = document.forms[form];
    }
    if (!isDefined(form) || !isDefined(form.tagName) || form.tagName != 'FORM')
    {
        errorMessage('[attachMenu]', 'Es wurde kein gültiges Formular-Element übergeben!');
        return false;
    }
    
    if (typeof textarea == 'number')
    {
        textarea = form.getElementsByTagName('textarea')[textarea];
    }
    
    if (!isDefined(textarea) || !isDefined(textarea.tagName) || textarea.tagName != 'TEXTAREA')
    {
        errorMessage('[attachMenu]', 'Es wurde kein gültiges Textarea-Element übergeben!');
        return false;
    }
    
    textarea.parentNode.insertBefore(box, textarea);
    textarea.id = 'ci_BBCode_input';
    textarea.style.backgroundImage = 'url(\'http://gfx.code-infection.de/ci_logo_mini.png\')';
    textarea.style.backgroundPosition = 'bottom right';
    textarea.style.backgroundRepeat = 'no-repeat';
    
    bindEvent(form, 'submit', function(e){
        if (!validateForm(form, textarea))
        {
            cancelEvent(e);
            alert('Es wurden nicht alle Felder ausgefüllt!');
            return false;
        }
        return true;
    });
    return true;
}
function preventLogout()
{
    var request = createRequest();
    ajax_get(
        request,
        '/_boards/check.asp?clanid=100',
        function(request)
        {
            //GM_log("logout prevention request successful");
        }
    );
}
function validateForm(form, textarea)
{
    var inputs = form.getElementsByTagName('input') || [];
    var failCount = 0;
    var onFocus = function(e){
        var sender = (e.target) ? e.target : e.srcElement;
        sender.style.backgroundColor = sender.oldBgColor;
        unbindEvent(sender, 'focus', onFocus);
    }
    
    for (var i = 0; i < inputs.length; i++)
    {
        if (inputs[i].type != 'radio' && inputs[i].type != 'image')
        {
            if (trim(inputs[i].value) == '')
            {
                inputs[i].oldBgColor = inputs[i].style.backgroundColor;
                inputs[i].style.backgroundColor = 'red';
                bindEvent(inputs[i], 'focus', onFocus);
                failCount++;
            }
        }
    }
    if (trim(textarea.value) == '')
    {
        textarea.oldBgColor = textarea.style.backgroundColor;
        textarea.style.backgroundColor = 'red';
        bindEvent(textarea, 'focus', onFocus);
        failCount++;
    }
    if (failCount > 0)
    {
        return false;
    }
    
    return true;
}

function getInbox()
{
    var request = createRequest();
    ajax_get(request, '/personal/inbox.asp', function(request){
        try
        {
            pmCheck(request.responseText);
        }
        catch (e)
        {
            alert(e);
        }
    });
}

var sound = null;
var alreadyAlerted = false;
var firstRun = true;
var PMsAvailableRegex = /<th>\s*Absender\s*<\/th>\s*<th>Betreff<\/th>\s*<th>Datum<\/th>/i;
var getPMRegex      = /<tr>\s*<td class="lcell[ab]" nowrap><span class="small"><span >([^<]*)<\/span><\/span><\/td>\s*<td class="lcell[ab]" width="100%"><span class="small">\s*(?:<span class="(?:mark|unalert)">[!#]<\/span>\s*)?<a href="([^"]*)"><span >([^<]*)<\/span><\/a>\s*<\/span><\/td>[\s\S]*?<\/tr>/i;
var getAllPMsRegex  = /<tr>\s*<td class="lcell[ab]" nowrap><span class="small"><span >([^<]*)<\/span><\/span><\/td>\s*<td class="lcell[ab]" width="100%"><span class="small">\s*(?:<span class="(?:mark|unalert)">[!#]<\/span>\s*)?<a href="([^"]*)"><span >([^<]*)<\/span><\/a>\s*<\/span><\/td>[\s\S]*?<\/tr>/ig;
function pmCheck(source)
{
    var PMs = [];
    if (source.match(PMsAvailableRegex))
    {
        var matches = source.match(getAllPMsRegex);
        if (matches)
        {
            for (var i = 0; i < matches.length; ++i)
            {
                var singleMatch = getPMRegex.exec(matches[i]);
                PMs[i] = {
                    author: singleMatch[1],
                    link: '/personal/' + singleMatch[2],
                    subject: singleMatch[3]
                }
            }
        }
    }
    
    generateWidget(PMs);
}

function generateWidget(PMs)
{
    var widget = document.getElementById('ci_BBCode_PMWidget');
    if (!widget)
    {
        widget = document.createElement('div');
        widget.id = 'ci_BBCode_PMWidget';
        widget.style.position = 'fixed';
        widget.style.top = '0';
        widget.style.right = '20px';
        widget.style.backgroundColor = 'silver';
        widget.style.fontFamily = 'Verdana';
        widget.style.padding = '3px';
        
        document.body.appendChild(widget);
    }
    
    var pmList = document.createElement('div');
    pmList.style.marginBottom = '5px';
    pmList.style.borderBottom = '1px solid red';
    pmList.id = 'ci_BBCode_PMWidget_List';
    for (var i = 0; i < PMs.length; ++i)
    {
        var PM = PMs[i];
        var container = document.createElement('div');
        container.style.marginBottom = '3px';
        container.style.fontSize = '12px';
        container.setAttribute('title', PM.author);
        
        var markRead = document.createElement('a');
        markRead.innerHTML = '[X]';
        markRead.href = '#';
        markRead.style.color = 'red';
        markRead.style.textDecoration = 'none';
        bindEvent(markRead, 'click', function(e){
            if (confirm('Willst du diese PN als gelesen markieren?'))
            {
                markUnread(PM);
            }
            cancelEvent(e);
        });
        
        var spacer = document.createElement('span');
        spacer.innerHTML = ' ';
        
        var subject = document.createElement('a');
        subject.style.color = 'black';
        subject.innerHTML = PM.subject;
        subject.setAttribute('href', PM.link);
        if (!stringContains(document.location.href, '/personal/'))
        {
            bindEvent(subject, 'click', function(e){
                cancelEvent(e);
                if (e.target)
                {
                    openPopupWindow(e.target.getAttribute('href'), 717, 525, true);
                    setTimeout(getInbox, 200);
                }
            });
        }
        
        container.appendChild(markRead);
        container.appendChild(spacer);
        container.appendChild(subject);
        
        pmList.appendChild(container);
    }
    
    var text = document.createElement('div');
    text.style.textAlign = 'right';
    text.style.cursor = 'pointer';
    text.style.color = 'black';
    text.id = 'ci_BBCode_PMWidget_Text';
    text.innerHTML = PMs.length + ' ungelesene PM(s)';
    if (PMs.length > 0)
    {
        bindEvent(text, 'click', function(){
            swapStyle(document.getElementById('ci_BBCode_PMWidget_List'), 'display', 'none', 'block');
        });
        if (sound && !alreadyAlerted && !readCookie('ci_BBCode_alerted'))
        {
            sound.play();
            alreadyAlerted = true;
            createCookie('ci_BBCode_alerted', 1, 50);
        }
    }
    else
    {
        alreadyAlerted = false;
        eraseCookie('ci_BBCode_alerted');
        firstRun = true;
    }
    
    if (firstRun)
    {
        pmList.style.display = 'none';
        firstRun = false;
    }
    
    widget.innerHTML = '';
    widget.appendChild(pmList);
    widget.appendChild(text);
}

function markUnread(PM)
{
    var request = createRequest();
    ajax_get(request, PM.link, getInbox);
}

function removeElementsOfType(tag)
{
    var removed = 0;
    var elems = document.getElementsByTagName(tag);
    
    for (var i = 0; i < elems.length; i++)
    {
        deleteNode(elems[i]);
        removed++;
    }

    return removed;
}

function main()
{
    if (!document.location.href.match(/^https?:\/\/(www\.)?clanplanet\.de/i))
    {
        return false;
    }
    
    var interval = null;
    if (!stringContains(document.location.href, '/personal/'))
    {
        setTimeout(function(){
            getInbox();
            interval = setInterval(getInbox, 1000 * 60 * .5);
        }, 0);
    }
    
    if (stringContains(document.location.href, '_boards/'))
    {
        setInterval(preventLogout, 1000 * 60 * 35);
    }
    
    if (document.forms.length === 0)
    {
        return false;
    }
    
    var defaultButtons = ['mark', 'url', 'img', 'email', 'b', 'i', 'quote', 'list', 'center'];
    var defaultStyle = {'marginTop':'2px','marginBottom':'2px'};
    
    if (stringContains(document.location.href, '_boards/post.asp'))
    {
        return attachMenu(0, 0, defaultStyle, defaultButtons);
    }
    else if (stringContains(document.location.href, '_sites/gbook.asp'))
    {
        var clanid = document.location.href.replace(/.*clanid=(\d{2,6}).*/, '$1');
        if (isDefined(unsafeWindow.weiterleitung))
        {
            window.location = window.location.protocol + '//'
                                 + window.location.hostname
                                 + window.location.pathname.replace(/\/[^\/]+?\.[^\/]*$/, '/')
                                 + "gbook.asp?rn=&clanid=" + clanid
                                 + "&pstfr=true";
            return false;
        }
        var gbookForm = null;
        for (var i = 0; i < document.forms.length; i++)
        {
            if (stringContains(document.forms[i].action, 'gbook.asp'))
            {
                gbookForm = document.forms[i];
                break;
            }
        }
        if (readCookie('gbook%5F' + clanid))
        {
            return false;
        }
        if (gbookForm === null)
        {
            errorMessage('[main/gbook]', 'Das Formular des Gästebuchs konnte nicht gefunden werden.');
            return false;
        }
        
        var gbookTextarea = gbookForm.parentNode.getElementsByTagName('textarea')[0];
        if (!gbookTextarea)
        {
            if (gbookForm.parentNode.getElementsByTagName('input').length < 2)
            {
                errorMessage('[main/gbook]', 'Das Textfeld das Gästebuchs konnte nicht gefunden werden.');
            }
            return false;
        }
        
        return attachMenu(gbookForm, gbookTextarea, defaultStyle, ['url', 'email']);
    }
    else if (stringContains(document.location.href, '_intern/news_add.asp'))
    {
        return attachMenu(0, 0, defaultStyle);
    }
    else if (
        stringContains(document.location.href, 'personal/sendmail.asp') &&
        !stringContains(document.location.href, '&action=preview')
    )
    {
        var Buttons = ['mark', 'url', 'email', 'b', 'i', 'quote', 'list', 'center'];
        return attachMenu(0, document.getElementsByTagName('textarea')[0], defaultStyle, Buttons);
    }
    else if (stringContains(document.location.href, '_intern/content.asp'))
    {
        var form = document.forms[0];
        if (document.forms.length > 0 && document.getElementsByTagName('textarea').length > 0)
        {
            var titel = form.getElementsByTagName('input')[0];
            if (titel.value == '-' && titel.type == 'hidden')
            {
                return attachMenu(0, 0, defaultStyle, ['url', 'email']);
            }
            else
            {
                var format = form.getElementsByTagName('span');
                format = format[format.length - 1];
                if (!format.getAttribute('class') == 'mark')
                {
                    errorMessage('[main]', 'Das Format dieses Inhaltes wurde nicht erkannt, es wird kein Menü angezeigt.');
                    return false;
                }
                else
                {
                    format = strip_tags(format.innerHTML);
                    if (format == 'HTML' || format == 'Nur Text')
                    {
                        return false;
                    }
                    else if (format == 'Text + CP Code')
                    {
                        return attachMenu(0, 0, defaultStyle, defaultButtons);
                    }
                    else
                    {
                        errorMessage('[main]', 'Das Format dieses Inhaltes ist unbekannt, es werden die Standardbuttons angezeigt.');
                        return attachMenu(0, 0, defaultStyle, defaultButtons);
                    }
                }
            }
        }
        else
        {
            return false;
        }
    }
    else
    {
        return false;
    }
}

try
{
    var result = main();
    //alert('Result: ' + result);
}
catch (err)
{
    try
    {
        var exceptionData = "";
        for (var name in err)
        {
            exceptionData += "Name: "+ name + "\nValue:\n'" + err[name] + "'\n\n";
        }
        exceptionData += "toString(): " + "value: '" + err.toString() + "'";
        
        errorMessage('Exception!', "<strong>Exception dump:</strong><br />" + exceptionData.replace(/\n/g, '<br />'));
    }
    catch (e)
    {
        alert(e);
    }
}
