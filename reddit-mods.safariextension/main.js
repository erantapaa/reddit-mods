
console.log("Here")

Date.prototype.relative = function(t2,fix){
  var t1 = this;
  var diff = t1 - t2;
  var minute = 60, hour = minute * 60, day = hour * 24,
  week = day * 7, month = day * 30, year = month * 12;
  return inRange(
    [0,'just now'],
    [5,'% seconds',1],
    [minute,'a minute'],
    [minute*2,'% minutes',minute],
    [minute*30,'half an hour'],
    [minute*31,'% minutes',minute],
    [hour,'an hour'],
    [hour*2,'% hours',hour],
    [hour*3,'a few hours'],
    [hour*4,'% hours',hour],
    [day,'a day'],
    [day*2,'% days',day],
    [week,'a week'],
    [week*2,'% weeks',week],
    [month,'a month'],
    [month*2,'% months',month],
    [year,'a year'],
    [year*2,'% years',year]
  );
  function inRange() {
    var span = Math.abs(diff/1000);
    for (var i = arguments.length-1; i >= 0; i--) {
      var range = arguments[i];
      if (span >= range[0]) {
        return (
          (fix&& diff>0?'in ':'') +
            (range[1].match(/%/)?
             range[1].replace(/%/g,Math.round(span/(range[2]? range[2] : 1)))
             : range[1]) +
            (fix&& diff<0?' ago':'')
        );
      }
    }
  }
};

// find all <time> tags
function find_div(e) {
  var count = 6
  var p = e
  var found
  while ((count-- > 0) && p) {
    // console.log("find_div at:", p, "tag:", p.tagName, "id:", p.getAttribute("id"))
    if (p.tagName == "DIV") {
      var id = p.getAttribute("id")
      if (id && id.match(/^thing_/)) {
        return p
      }
    }
    p = p.parentElement
  }
  return null
}

function contains_class(cls, classes) {
  if (!classes) {
    return -1
  }
  var i = 0
  while (true) {
    i = classes.indexOf(cls, i)
    if (i < 0) break
    if (((i == 0) || (classes.charAt(i-1) == ' ')) && ((i+cls.length >= classes.length) || (classes.charAt(i+cls.length) == ' '))) {
      return i
    }
    i = i + 1
  }
  return (-1)
}

function find_author(e) {
  var p = e
  while (p) {
    if (p.tagName == "A") {
      if (contains_class("author", p.className) >= 0) {
        return p
      }
    }
    p = p.previousSibling
  }
}

function compare_datetime(a, b) {
  if (a.time > b.time) { return -1 }
  else if (a.time < b.time) { return 1 }
  else return 0
}

function find_items() {
  var times = document.getElementsByTagName('time')
  var items = {}
  for (var i = 0; i < times.length; i++) {
    var t = times[i]
    var a = find_author(t)
    if (!a) continue
    var d = find_div(t)
    var div_id = d.getAttribute("id")
    items[ div_id ] = {
      "time": t.getAttribute("datetime"),
      "author": a.textContent,
      "div_id": d.getAttribute("id"),
      "ago": t.textContent
      }
  }

  // find all forms
  var forms = document.getElementsByTagName("form")
  for (var i = 0; i < forms.length; i++) {
    var f = forms[i]
    var d = find_div(f)
    if (d) {
      var div_id = d.getAttribute("id")
      if (items[div_id]) {
        items[div_id]["form_id"] = f.getAttribute("id")
      }
    }
  }

  return items
}

function find_side_div() {
  var divs = document.getElementsByClassName("linkinfo")
  if (divs.length) {
    return divs[0].parentElement
  } else {
    return null
  }
}

function go_comment(div_id) {
  console.log("div_id:", div_id)
  document.getElementById(div_id).scrollIntoView({ block: 'start', behavior: 'smooth' }) 
  return false
}
// onClick="document.getElementById('more').scrollIntoView({block: 'start', behavior: 'smooth'});"

function make_li(now, item) {
  var dt = item.time
  var a = document.createElement("a")
  a.onclick = function() { go_comment(item.div_id) }
  a.textContent = item.author + " " + item.ago
  var li = document.createElement("li")
  li.appendChild(a)
  return li
}

function add_class(cls, elt) {
  var classes = elt.className || ""
  var i = contains_class(cls, classes)
  if (i < 0) {
    if (classes.length == 0) {
      elt.className = cls
    } else {
      elt.className = classes + " " + cls
    }
  }
}

function remove_class(elt, cls) {
  var classes = elt.className
  var i = contains_class(cls, classes)
  if (i == 0) {
    elt.className = classes.substring(i+cls.length+1)
  } else if (i > 0) {
    elt.className = classes.substring(0, i-1) + classes.substring(i+cls.length)
  }
}

function rm_class(cls, classes) {
  var i = contains_class(cls, classes)
  if (i == 0) {
    return classes.substring(i+cls.length+1)
  } else if (i > 0) {
    return classes.substring(0, i-1) + classes.substring(i+cls.length)
  } else {
    return classes
  }
}

// form-... thing_...

function highlight(items, since) {
  var forms = document.getElementsByTagName("form")
  for (var i = 0; i < forms.length; i++) {
    var f = forms[i]
    var form_id = f.getAttribute("id")
    var d = find_div(f)
    if (d) {
      var div_id = d.getAttribute("id")
      var item = items[ div_id ]
      if (item) {
        console.log("found item for form " + form_id)
        var date = new Date(item.time)
        if (date >= since) {
          console.log("adding class to form " + form_id)
          add_class("highlight", f)
        } else {
          console.log("removing class to form " + form_id)
          remove_class("highlight", f)
        }
      }
    }
  }
}

function insert_input_box(items) {
  var side = find_side_div()
  if (!side) {
    console.log("unable to find side div")
    return
  }
  // div class spacer, div class sidebox
  var div1 = document.createElement("div")
  div1.className = "spacer padded"
  var inp = document.createElement("input")
  div1.innerHTML = "Highlight recent posts: <input id='highlight-input' size=10> hours"
  side.parentNode.insertBefore(div1, side)
  var inp = document.getElementById("highlight-input")
  inp.addEventListener('change', function() {
    var v = parseInt(this.value)
    var since = new Date(new Date() - (v*3600*1000))
    highlight(items, since)
    return false
  })
  console.log("done with insert_input_box")
}

function inject_css() {
  var style = document.createElement("style")
  var articblue = '#F0F8FF'
  var inner = document.createTextNode(".highlight { background-color: lightblue } .padded { padding-bottom: 30px } ")
  style.appendChild(inner)
  document.getElementsByTagName("head")[0].appendChild(style);
}

function doit() {
  var now = new Date()
  var items = find_items()
  var side_div = find_side_div()
  console.log("side_div:", side_div)

  // div class spacer, div class sidebox
  var div1 = document.createElement("div")
  var div2 = document.createElement("div")
  var inner = document.createElement("ul")
  for (var i = 0; i < items.length; i++) {
    inner.appendChild(make_li(now, items[i]))
  }
  div1.className = "spacer"
  div2.appendChild(inner)
  div2.className = "sidebox"
  div1.appendChild(div2)
  console.log("inner:", inner)

  if (side_div) {
    side_div.parentNode.insertBefore(div1, side_div.nextSibling)
  } else {
    console.log("no side_div found")
  }
}

function test() {
  inject_css()
  var now = new Date()
  var items = find_items()
  console.log("item count: " + items.length)
  insert_input_box(items)
  var since = new Date(now - 24*3600*1000) // 24 hours ago
  // highlight(items, since)
}

test()
console.log("done with test")

