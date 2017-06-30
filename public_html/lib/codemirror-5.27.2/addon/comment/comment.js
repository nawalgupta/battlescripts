'use strict';(function(h){"object"==typeof exports&&"object"==typeof module?h(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],h):h(CodeMirror)})(function(h){function w(b){b=b.search(q);return-1==b?0:b}function E(b,d,a){return/\bstring\b/.test(b.getTokenTypeAt(k(d.line,0)))&&!/^[\'\"\`]/.test(a)}function C(b,d){var a=b.getMode();return!1!==a.useInnerComments&&a.innerMode?b.getModeAt(d):a}var A={},q=/[^\s\u00a0]/,k=h.Pos;h.commands.toggleComment=
function(b){b.toggleComment()};h.defineExtension("toggleComment",function(b){b||(b=A);for(var d=Infinity,a=this.listSelections(),e=null,c=a.length-1;0<=c;c--){var f=a[c].from(),g=a[c].to();f.line>=d||(g.line>=d&&(g=k(d,0)),d=f.line,null==e?this.uncomment(f,g,b)?e="un":(this.lineComment(f,g,b),e="line"):"un"==e?this.uncomment(f,g,b):this.lineComment(f,g,b))}});h.defineExtension("lineComment",function(b,d,a){a||(a=A);var e=this,c=C(e,b),f=e.getLine(b.line);if(null!=f&&!E(e,b,f)){var g=a.lineComment||
c.lineComment;if(g){var m=Math.min(0!=d.ch||d.line==b.line?d.line+1:d.line,e.lastLine()+1),h=null==a.padding?" ":a.padding,l=a.commentBlankLines||b.line==d.line;e.operation(function(){if(a.indent){for(var d=null,c=b.line;c<m;++c){var f=e.getLine(c);f=f.slice(0,w(f));if(null==d||d.length>f.length)d=f}for(c=b.line;c<m;++c){f=e.getLine(c);var n=d.length;if(l||q.test(f))f.slice(0,n)!=d&&(n=w(f)),e.replaceRange(d+g+h,k(c,0),k(c,n))}}else for(c=b.line;c<m;++c)(l||q.test(e.getLine(c)))&&e.replaceRange(g+
h,k(c,0))})}else if(a.blockCommentStart||c.blockCommentStart)a.fullLines=!0,e.blockComment(b,d,a)}});h.defineExtension("blockComment",function(b,d,a){a||(a=A);var e=this,c=C(e,b),f=a.blockCommentStart||c.blockCommentStart,g=a.blockCommentEnd||c.blockCommentEnd;if(!f||!g)(a.lineComment||c.lineComment)&&0!=a.fullLines&&e.lineComment(b,d,a);else if(!/\bcomment\b/.test(e.getTokenTypeAt(k(b.line,0)))){var m=Math.min(d.line,e.lastLine());m!=b.line&&0==d.ch&&q.test(e.getLine(m))&&--m;var h=null==a.padding?
" ":a.padding;b.line>m||e.operation(function(){if(0!=a.fullLines){var l=q.test(e.getLine(m));e.replaceRange(h+g,k(m));e.replaceRange(f+h,k(b.line,0));var x=a.blockCommentLead||c.blockCommentLead;if(null!=x)for(var p=b.line+1;p<=m;++p)(p!=m||l)&&e.replaceRange(x+h,k(p,0))}else e.replaceRange(g,d),e.replaceRange(f,b)})}});h.defineExtension("uncomment",function(b,d,a){a||(a=A);var e=this,c=C(e,b),f=Math.min(0!=d.ch||d.line==b.line?d.line:d.line-1,e.lastLine()),g=Math.min(b.line,f),h=a.lineComment||c.lineComment,
w=[],l=null==a.padding?" ":a.padding,x;a:if(h){for(var p=g;p<=f;++p){var B=e.getLine(p),n=B.indexOf(h);-1<n&&!/comment/.test(e.getTokenTypeAt(k(p,n+1)))&&(n=-1);if(-1==n&&q.test(B))break a;if(-1<n&&q.test(B.slice(0,n)))break a;w.push(B)}e.operation(function(){for(var a=g;a<=f;++a){var b=w[a-g],c=b.indexOf(h),d=c+h.length;0>c||(b.slice(d,d+l.length)==l&&(d+=l.length),x=!0,e.replaceRange("",k(a,c),k(a,d)))}});if(x)return!0}var u=a.blockCommentStart||c.blockCommentStart,r=a.blockCommentEnd||c.blockCommentEnd;
if(!u||!r)return!1;var D=a.blockCommentLead||c.blockCommentLead,y=e.getLine(g),z=y.indexOf(u);if(-1==z)return!1;var v=f==g?y:e.getLine(f),t=v.indexOf(r,f==g?z+u.length:0);-1==t&&g!=f&&(v=e.getLine(--f),t=v.indexOf(r));a=k(g,z+1);c=k(f,t+1);if(-1==t||!/comment/.test(e.getTokenTypeAt(a))||!/comment/.test(e.getTokenTypeAt(c))||-1<e.getRange(a,c,"\n").indexOf(r))return!1;c=y.lastIndexOf(u,b.ch);a=-1==c?-1:y.slice(0,b.ch).indexOf(r,c+u.length);if(-1!=c&&-1!=a&&a+r.length!=b.ch)return!1;a=v.indexOf(r,d.ch);
b=v.slice(d.ch).lastIndexOf(u,a-d.ch);c=-1==a||-1==b?-1:d.ch+b;if(-1!=a&&-1!=c&&c!=d.ch)return!1;e.operation(function(){e.replaceRange("",k(f,t-(l&&v.slice(t-l.length,t)==l?l.length:0)),k(f,t+r.length));var a=z+u.length;l&&y.slice(a,a+l.length)==l&&(a+=l.length);e.replaceRange("",k(g,z),k(g,a));if(D)for(a=g+1;a<=f;++a){var b=e.getLine(a),c=b.indexOf(D);if(-1!=c&&!q.test(b.slice(0,c))){var d=c+D.length;l&&b.slice(d,d+l.length)==l&&(d+=l.length);e.replaceRange("",k(a,c),k(a,d))}}});return!0})});