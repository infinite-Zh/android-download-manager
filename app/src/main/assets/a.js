//javascript:
//var script = document.createElement('script');
//script.type = 'text/javascript';
//script.text = "
var oldParentElement;
var m_mouseOffset;
var m_mousePosX, m_mousePosY;
var m_enableCapture;
var m_portraitMode;
var m_iOS5;
var m_screenWidth;
var m_screenHeight;
function IsAlpha(ch){
    return (/[a-zA-Z0-9]+/.test(ch));
}
function IsChinese(ch){
    if (/[^\u4e00-\u9fa5]/.test(ch))
        return false;
    return true;
}
function GetWordUnderMousePointer(){
    var range = document.caretRangeFromPoint(m_mousePosX, m_mousePosY);
    if (range){
        var chinese = false;
        var d = range.startOffset, i = range.endOffset;
        m_mouseOffset = d;
        var h = 0, e = 0, f = 0, g = range.cloneRange(), b= '';
        var beginCursor = 0, endCursor = 0;
        if (range.startContainer.data){
            for (; d >= 1;){
                g.setStart(range.startContainer, --d);
                b = g.toString();
                if (!IsAlpha(b.charAt(0))){
                    if (IsChinese(b.charAt(0))){
                        chinese = true;
                        f++;
                    }
                    if (b.charAt(0) == ' '){
                        e++;
                        if (beginCursor == 0)
                            beginCursor = d+1;
                    }
                    if (e == 0 && f == 0 || e == 2 || f == 5){
                        g.setStart(range.startContainer, d + 1);
                        if (beginCursor == 0)
                            beginCursor = d+1;
                        break;
                    }
                }
                h++;
            }
        }
        m_mouseOffset -= d + 1;
        if (h != 0){
            f = e = h = 0;
            if (range.endContainer.data) {
                for (; i < range.endContainer.data.length;){
                    g.setEnd(range.endContainer, ++i);
                    b = g.toString();
                    if (!IsAlpha(b.charAt(b.length - 1))){
                        if (IsChinese(b.charAt(b.length - 1))){
                            chinese = true;
                            f++;
                        }
                        if (b.charAt(b.length - 1) == ' '){
                            e++;
                            if (endCursor == 0)
                                endCursor = i-1;
                        }
                        if (e == 0 && f == 0 || e == 2 || f == 5){
                            g.setEnd(range.endContainer, i - 1);
                            if (endCursor == 0)
                                endCursor = i - 1;
                            break;
                        }
                    }
                    h++;
                }
            }
            if (h != 0){
                d = g.toString();
                if (!chinese){
                    if (endCursor == 0)
                        endCursor = range.endContainer.data.length;
                    SelectRange(g, beginCursor, endCursor);
                }
                if (d.length >= 1)
                    return d;
            }
        }
    }
    clearSelectTag();
    return '';
}

function SelectRange(range, begin, end)
{
    if (begin == end){
        return;
    }

    var newRange = range.cloneRange();
    var parentElement = newRange.startContainer.parentElement;
    if (parentElement.id=="touchtext"){
        return;
    }

    newRange.setStart(newRange.startContainer,begin);
    newRange.setEnd(newRange.endContainer,end);
    var word = newRange.toString();

    newRange.setStart(newRange.startContainer,0);
    newRange.setEnd(newRange.startContainer,begin);
    var text1 = newRange.toString();

    newRange.setStart(newRange.startContainer,end);
    newRange.setEnd(newRange.startContainer,newRange.endContainer.data.length);
    var text2 = newRange.toString();

    //原文
    var originalText = text1 + word  + text2;

    //替换文字
    var newText = text1+"<span id=\"touchtext\" class=\"select\">" + word + "</span>" + text2;

    if (parentElement){
        //新选定单词落在已经标记的段落中
        if (parentElement == oldParentElement){
            var parentHtml = oldParentElement.innerHTML;
            var startIndex = parentHtml.indexOf("<span id=\"touchtext\" class=\"select\">");
            var leftHtml = parentHtml.substring(0, startIndex);
            var endIndex = parentHtml.indexOf("</span>", startIndex);
            var rightHtml = parentHtml.substring(endIndex + 7);
            var tagText = parentHtml.substring(startIndex + 36, endIndex);
            var orgParentHtml = leftHtml + tagText + rightHtml;

            var previousEle = newRange.startContainer.previousElementSibling;
            var nextEle = newRange.startContainer.nextElementSibling;
            if (previousEle != null && previousEle.nodeName == "SPAN" && previousEle.className == "select"){
            	if (nextEle == null)  //如果后面没有节点，就直接拼接
            	    newText = leftHtml + tagText + newText;
                else{
                	newText = rightHtml.replace(originalText, newText);
                	newText = leftHtml + tagText + newText;
                }
            }
            else if (nextEle != null && nextEle.nodeName == "SPAN" && nextEle.className == "select"){
            	if (previousEle == null)  //如果前面没有节点，就直接拼接
            	    newText = newText + tagText + rightHtml;
            	else{
            		newText = leftHtml.replace(originalText, newText);
                	newText = newText + tagText + rightHtml;
            	}
            }
            else{
            	if (previousEle == null){
            		newText = leftHtml.replace(originalText, newText);
                	newText = newText + tagText + rightHtml;
            	}
	            else if (nextEle == null){
	            	newText = rightHtml.replace(originalText, newText);
                	newText = leftHtml + tagText + newText;
	            }
	            else{
	            	newText = orgParentHtml.replace(originalText, newText);
	            }
            }

            parentElement.innerHTML = newText;
            oldParentElement = parentElement;
            return;
        }
        //清除上次选中的标记
        else if (oldParentElement != null){
            var lastSelect = document.getElementById('touchtext');
            if (lastSelect){
                var parent = lastSelect.parentElement;
                if (parent){
                    var parentHtml = parent.innerHTML;
                    var startIndex = parentHtml.indexOf("<span id=\"touchtext\" class=\"select\">");
                    var leftHtml = parentHtml.substring(0, startIndex);
                    var endIndex = parentHtml.indexOf("</span>", startIndex);
                    var rightHtml = parentHtml.substring(endIndex + 7);
                    var tagText = parentHtml.substring(startIndex + 36, endIndex);
                    parent.innerHTML = leftHtml + tagText + rightHtml;
                }
            }

            oldParentElement = null;
        }

        //设置新标记文字
        var innerHtml = parentElement.innerHTML;
        var newHtml = innerHtml.replace(originalText, newText);

        parentElement.innerHTML = newHtml;
        oldParentElement = parentElement;
    }
}





function clearSelectTag()
{
    if (oldParentElement != null){
        var lastSelect = document.getElementById('touchtext');
        if (lastSelect){
            var parent = lastSelect.parentElement;
            if (parent){
                var parentHtml = parent.innerHTML;
                var startIndex = parentHtml.indexOf("<span id=\"touchtext\" class=\"select\">");
                var leftHtml = parentHtml.substring(0, startIndex);
                var endIndex = parentHtml.indexOf("</span>", startIndex);
                var rightHtml = parentHtml.substring(endIndex + 7);
                var tagText = parentHtml.substring(startIndex + 36, endIndex);
                parent.innerHTML = leftHtml + tagText + rightHtml;
            }
        }

        oldParentElement = null;
    }
}

function OnMouseDown(event){
    if (!m_enableCapture)
        return;
    if (event.touches.length != 1)
        return;
    if(event.srcElement.tagName =="IMG"){
        imageClickAction();
        return;
    }

    var touch = event.touches[0];
    m_mousePosX = touch.clientX;
    m_mousePosY = touch.clientY;
    /*alert('X:' + m_mousePosX + ', ' + 'Y:' + m_mousePosY);
    alert('screen.width:' + screen.width + ', ' + 'window.innerWidth:' + window.innerWidth);
    alert(window.orientation);*/
}

function OnMouseUp(event){
    if (!m_enableCapture)
        return;
    if (event.changedTouches.length != 1)
        return;
    if(event.srcElement.tagName =="IMG"){
        imageClickAction();
        return;
    }
    var touch = event.changedTouches[0];
    if (Math.abs(m_mousePosX - touch.clientX) < 12 &&
        Math.abs(m_mousePosY - touch.clientY) < 12){
        //event.preventDefault();
        var text = GetWordUnderMousePointer();
        /*if (text != '')*/
        {
            /*alert(text);*/
            var realWidth;
            if (m_portraitMode)
            /*realWidth = screen.width;*/
                realWidth = m_screenWidth;
            else
            /*realWidth = screen.height;*/
                realWidth = m_screenHeight;
            var scale = realWidth / window.innerWidth;
            /*alert('screen:(' + m_screenWidth + ', ' + m_screenHeight + ')');*/
            /*alert('window:(' + window.innerWidth + ', ' + window.innerHeight + ')');*/
            var xPos, yPos;
            if (m_iOS5){
                xPos = Math.round(m_mousePosX * scale);
                yPos = Math.round(m_mousePosY * scale);
            }else{
                xPos = Math.round((m_mousePosX - window.pageXOffset) * scale);
                yPos = Math.round((m_mousePosY - window.pageYOffset) * scale);
            }
            /*alert('xPos:' + xPos + '  yPos:' + yPos);*/
            var offset = m_mouseOffset;
            var url='appcmd::capturetext::' + text + '::' + offset + '::' + xPos + '::' + yPos + '::' + event.srcElement.tagName;
            document.location = url;
        }
    }
}

function OnClick(event){
    if (m_enableCapture)
        event.preventDefault();
}

function SetEnableCapture(fEnable){
    m_enableCapture = fEnable;
}

function SetPortraitMode(fPortrait){
    m_portraitMode = fPortrait;
}

function InitCaptureText(fiOS5, screenWidth, screenHeight){
    m_enableCapture = true;
    m_portraitMode = true;
    m_iOS5 = fiOS5;
    m_screenWidth = screen.width;
    m_screenHeight = screen.height;
    /* ver1.2 - Disabling the selection flash */
    document.documentElement.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0)';
    document.addEventListener('touchstart', OnMouseDown, false);
    document.addEventListener('touchend', OnMouseUp, false);
    /*for(i = 0; i < document.all.length; i++){
        curElement = document.all(i);
        if (curElement.tagName != 'HTML' && curElement.tagName != 'HEAD' &&
            curElement.tagName != 'TITLE' && curElement.tagName != 'META' &&
            curElement.tagName != 'STYLE' && curElement.tagName != 'SCRIPT' &&
            curElement.tagName != 'BODY' && curElement.tagName != 'FORM' &&
            curElement.tagName != 'DIV' && curElement.tagName != 'UL' &&
            curElement.tagName != 'LI'
            ){

            curElement.addEventListener('mousedown', OnMouseDown, false);
            curElement.addEventListener('mouseup', OnMouseUp, true);
            curElement.addEventListener('click', OnClick, false);
        }
    }*/


}