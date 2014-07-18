/*jslint todo: true */
/*global $, console*/
/*jslint browser:true */
/*jslint plusplus: true */
"use strict";

function setSectionMouseEvents(section, sectionTimes, course) {
    setSectionOnClick(section, sectionTimes, course);
    setSectionMouseOver(section, sectionTimes, course);
    setSectionMouseOut(section, sectionTimes);
}

/** Mouse Out Direct Functions **/

function setSectionMouseOut(section, sectionTimes) {
    $(section).mouseout(function () {
        performMouseOut(sectionTimes);
    });
}

function performMouseOut(sectionTimes) {
    $.each(sectionTimes, function (i, time) {
        if ($(time).attr("clicked") !== "true") {
            $(time).html("");
        }
        $(time).removeClass("mouseOverConflict mouseOverGood " +
                            "mouseOverRemove");
    });
}

function removeMouseOverClasses() {
    $("td").removeClass("mouseOverConflict mouseOverGood " +
                        "mouseOverRemove");
}

/** Mouse Over Direct Functions **/

function setSectionMouseOver(section, sectionTimes, course) {
    $(section).mouseover(function () {
        performMouseOver(sectionTimes, course);
        displayCourseInformation(course, $(this));
    });
}

function performMouseOver(sectionTimes, course) {
    $.each(sectionTimes, function (i, time) {
        if (getIsClicked(time)) {
            lightUpConflict(course, time);
        } else {
            lightUpTakeable(course, time);
        }
    });

}

function lightUpConflict(course, time) {
    if ($(time).html() === course.name) {
        $(time).addClass("mouseOverRemove");
    } else {
        $(time).addClass("mouseOverConflict");
    }
}

function lightUpTakeable(course, time) {
    $(time).addClass("mouseOverGood");
    $(time).html(course.name);
}

// IAN-TODO: you'll need to break this into two separate functions
// IAN-RESPONSE: Let's discuss this.
function displayCourseInformation(course, section) {
    $("#course-info-code").html(course.name);
    $("#course-info-title").html(course.title);
    $("#section-stats-section").html(section.html());
    $("#section-stats-instructor").html(section.data("instructor"));
}

/** Mouse Click Direct Functions **/

function setSectionOnClick(section, sectionTimes, course) {
    $(section).click(function () {
        var isLecture = section.innerHTML.charAt(0) === "L";
        var taken = false;
        var satisfied = true;
        var inConflict = false;
        // IAN-TODO: this is a bigger task, but I really don't think
        // we need separate functions for lectures and tutorials
        // IAN-RESPONSE: IPR
        if (isLecture) {
            if (course.isLectureSelected) {
                selectAlreadySelectedLecture(course, section, sectionTimes);
            } else {
                setSession(course, section);
                selectNewLecture(course, section, sectionTimes);
            }
        } else {
            if (course.isTutorialSelected) {
                selectAlreadySelectedTutorial(course, section, sectionTimes);
            } else {
                setSession(course, section);
                selectUnselectedTutorial(course, section, sectionTimes);
            }

        }
        satisfyCourse(course);

        $("#" + course.name + "-li li[clicked*='true']").each(function() {
            if (course.satisfied) {
                $(this).addClass("clickedLectureTime");
            }

            if (!inArray($(this).attr("id"), selectedLectures)) {
                    selectedLectures.push($(this).attr("id"));
            }
        });

        $("#" + course.name + "-li li[clicked*='false']").each(function() {
            $(this).removeClass("clickedLectureTime");

            var index = $.inArray($(this).attr("id"), selectedLectures);
            if (index > -1) {
                selectedLectures.splice(index, 1);
            }

        });

        $("#" + course.name + "-li li[satisfied*='true']").removeClass("clickedSectionUnsatisfied");

        $("td[clicked*=false]").attr("satisfied", true)
                               .attr("type", "")
                               .html("")
                               .removeClass("clickedLectureTime clickedTutorialTime");

        $("td[satisfied*=false][in-conflict*=false]").addClass("clickedSectionUnsatisfied")
                                                     .removeClass("clickedLectureTime clickedTutorialTime");

        $("td[satisfied*=true]").removeClass("clickedSectionUnsatisfied");

        $("td[in-conflict*=true]").removeClass("clickedSectionUnsatisfied" +
                                               "clickedLectureTime clickedTutorialTime")
                                  .addClass("clickedConflictTime");


        $("td[in-conflict*=false]").removeClass("clickedConflictTime");

        $("td[in-conflict*=false][satisfied*=true][type*=L]").addClass("clickedLectureTime");

        $("td[in-conflict*=false][satisfied*=true][type*=T]").addClass("clickedTutorialTime");

        // IAN-TODO Seems like taken and satisfied can be recovered
        // from course
        setHeader(course);
        setCookie("selected-lectures", JSON.stringify(selectedLectures));
        // IAN-TODO we had a problem with this before. Can't remember why.
        // IAN-RESPONSE: Can't remember either. When all CSS is moved to a .CSS file, push will come to shove.
        removeMouseOverClasses();

        alertUserOfConflict();

        if (course.satisfied) {
            $(course.selectedLecture).removeClass("clickedSectionUnsatisfied");
            $(course.selectedTutorial).removeClass("clickedSectionUnsatisfied");
            $("#" + course.name + "-li" + " li").attr("satisfied", true);
        } else {
            $(course.selectedLecture).addClass("clickedSectionUnsatisfied");
            $(course.selectedTutorial).addClass("clickedSectionUnsatisfied");
        }

        if (!course.isTutorialSelected) {
            $(course.selectedTutorial).removeClass("clickedSectionUnsatisfied");
        } else if (!course.satisfied) {
            $(course.selectedTutorial).addClass("clickedSectionUnsatisfied");
        }

        if (!course.isLectureSelected) {
            $(course.selectedLecture).removeClass("clickedSectionUnsatisfied");
        } else if (!course.satisfied) {
            $(course.selectedLecture).addClass("clickedSectionUnsatisfied");
        }

        if (!course.satisfied) {
            if (course.isTutorialSelected) {
                $(course.selectedTutorial).addClass("clickedSectionUnsatisfied");
            } else if (course.isLectureSelected) {
                $(course.selectedLecture).addClass("clickedSectionUnsatisfied");
            }
        }
    });
}

/** Utilities **/

// IAN-RESPONSE It seemed kind of silly to make this function, given that the index is sometimes used.
function inArray(item, array) {
    return $.inArray(item, array) > -1;
}

// IAN-TODO I guess you want to switch to attributes
// There should really be just one status attribute.
// This seems just like how we handle the nodes in the graph.
function setHeader(course) {
    var taken;

    if ($("#" + course.name + "-li li[clicked*='true']").length) {
        taken = true;
    }

    if (taken && course.satisfied) {
        $(course.header).removeClass("clickedSectionUnsatisfied")
                        .addClass("clicked-header");
        course.taken = true;
    } else if (!course.satisfied) {
        $(course.header).addClass("clickedSectionUnsatisfied");
    } else {
        $(course.header).removeClass("clickedSectionUnsatisfied clicked-header");
        course.taken = false;
    }
}

function getInConflict() {
    return $("td[class*=clickedConflictTime]").length > 0;
}

function alertUserOfConflict() {
    if (getInConflict()) {
        $("#dialog").fadeIn(750);
    } else {
        $("#dialog").fadeOut(750);
    }
}

function getIsClicked(time) {
    return $(time).attr("clicked") === "true";
}

function getSession(section) {
    if (getIsYearSection(section)) {
        return "Y";
    } else if (getIsFallSection(section)) {
        return "F";
    } else if (getIsSpringSection(section)) {
        return "S";
    }
}

function getIsYearSection(section) {
    return $(section.parentNode).hasClass("sectionList-year");
}

function getIsFallSection(section) {
    return $(section.parentNode).hasClass("sectionList-fall");
}

function getIsSpringSection(section) {
    return $(section.parentNode).hasClass("sectionList-spring");
}

// Need to adapt code for P.
function getType(section) {
    if (($(section).html().charAt(0) == 'L')) {
        return "L";
    } else {
        return "T";
    }
}

function setClickedConflict(course, time, section) {
    var type = getType(section);
    var conflictArray = $(time).data("conflictArray");
    var typeArray = $(time).data("typeArray");
    conflictArray.push(course.name);
    typeArray.push(type);
    $(time).data("conflictArray", conflictArray)
           .data("typeArray", typeArray)
           .attr("title", conflictArray)
           .attr("in-conflict", "true");
}

function removeClickedConflict(course, time, section) {
    var conflictArray = $(time).data("conflictArray");
    var typeArray = $(time).data("typeArray");

    // IAN-TODO This code should be (basically) one big if-else block.
    // Either course.name is in the td, or it's in the list,
    // but not both.
    // IAN-RESPONSE Let's discuss this again
    var index = conflictArray.indexOf(course.name);
    if ($(time).html() === course.name) {
        $(time).html(conflictArray[0])
               .attr("type", typeArray[0]);
    }
    if (conflictArray.length === 1) {
        $(time).attr("in-conflict", "false");
    }
    conflictArray.splice(index, 1);
    typeArray.splice(index, 1);
    var newCourseObject = getCourseObject($(time).html());
    $(time).attr("satisfied", newCourseObject.satisfied)
           .data("conflictArray", conflictArray)
           .data("typeArray", typeArray)
           .attr("title", conflictArray);
}


/** Lecture Functions **/

function selectUnselectedLecture(course, section, sectionTimes) {
    $(section).attr("clicked", "true");
    setSession(course, section);
    course.selectedLecture = section;
    course.isLectureSelected = true;
    selectUnselectedTimes(course, sectionTimes, section);

    course.selectedLectureTimes = sectionTimes;
}

function selectAlreadySelectedLecture(course, section, sectionTimes) {
    var selectedSession;

    turnLectureOff(course, section, sectionTimes);

    selectedSession = getSession(section);

    if (course.selectedLecture.innerHTML !== section.innerHTML
        || course.selectedLectureSession !== selectedSession) {
        selectNewLecture(course, section, sectionTimes);
    } else {
        course.selectedLecture = undefined;
        course.selectedLectureSession = undefined;
        course.selectedLectureTimes = undefined;
    }
}

function turnLectureOff(course, section, sectionTimes) {
    course.isLectureSelected = false;

    $(course.selectedLecture).attr("clicked", "false");
    removeLecture(course, section);
}

function removeLecture(course, section) {
    $.each(course.selectedLectureTimes, function (i, time) {
        if ($(time).attr("in-conflict") === "true") {
            removeClickedConflict(course, time, section);
        } else {
            $(time).html("")
                   .attr("clicked", "false");
        }
    });
}

function selectNewLecture(course, section, sectionTimes) {
    $(section).attr("clicked", "true");
    setSession(course, section);
    course.isLectureSelected = true;
    course.selectedLecture = section;
    course.selectedLectureTimes = sectionTimes;
    selectUnselectedTimes(course, sectionTimes, section);
}

/** Tutorial Functions **/

function selectUnselectedTutorial(course, section, sectionTimes) {
    $(section).attr("clicked", "true");
    setSession(course, section);
    course.selectedTutorial = section;
    course.isTutorialSelected = true;

    selectUnselectedTimes(course, sectionTimes, section);

    course.selectedTutorialTimes = sectionTimes;
}

function selectAlreadySelectedTutorial(course, section, sectionTimes) {
    var selectedSession;

    turnTutorialOff(course, section, sectionTimes);
    selectedSession = getSession(section);

    if (course.selectedTutorial.innerHTML !== section.innerHTML
        || course.selectedTutorialSession !== selectedSession) {
        selectNewTutorialSection(section, sectionTimes, course, selectedSession);
    } else {
        course.selectedTutorial = undefined;
        course.selectedTutorialSession = undefined;
        course.selectedTutorialTimes = undefined;
    }
}

function turnTutorialOff(course, section, sectionTimes) {
    course.isTutorialSelected = false;
    $(course.selectedTutorial).attr("clicked", "false");
    
    removeTutorial(course, section);
}

function removeTutorial(course, section) {
    $.each(course.selectedTutorialTimes, function (i, time) {
        if ($(time).attr("in-conflict") === "true") {
            removeClickedConflict(course, time, section);
        } else {
            $(time).html("")
                   .attr("clicked", "false");
        }
    });
}

function selectNewTutorialSection(section, sectionTimes, course, selectedSession) {
    $(section).attr("clicked", "true");

    if(course.selectedTutorialSession !== selectedSession) {
        course.selectedTutorialSession = selectedSession;
    }

    course.isTutorialSelected = true;
    course.selectedTutorial = section;
    course.selectedTutorialHeader = course.header;
    course.selectedTutorialTimes = sectionTimes;
    selectUnselectedTimes(course, sectionTimes, section);
}

function setTutorialUnclicked(time, course) {
    course.isTutorialSelected = false;
    $(time).attr("clicked", "false");
}

/** Unified course functions (!) **/

function setSession(course, section) {
    var type = getType(section);
    var session = getSession(section);
    if (type == "L") {
        course.selectedLectureSession = session;
    } else {
        course.selectedTutorialSession = session;
    }
}

function selectUnselectedTimes(course, sectionTimes, section) {
    $.each(sectionTimes, function (i, time) {
        if (!getIsClicked(time)) {
            setClickedTime(course, time, section);
        } else {
            setClickedConflict(course, time, section);
        }
    });
}

function setClickedTime(course, time, section) {
    var type = getType(section);

    if (type === "L") {
        course.isLectureSelected = true;
        if (!course.satisfied) {
            setSatisfaction(time, course.satisfied);
            $(course.selectedLecture).attr("satisfied", "false");
        }
    } else {
        course.isTutorialSelected = true;
        if (!course.satisfied) {
            setSatisfaction(time, course.satisfied);
            $(course.selectedTutorial).attr("satisfied", "false");
        }
    }

    $(time).html(course.name)
           .attr("clicked", "true")
           .attr("type", type);
}

// IAN RESPONSE: :-)
function satisfyCourse(course) {
    course.satisfied = (course.selectedTutorialSession === course.selectedLectureSession) || !course.manualTutorialEnrolment;
    setSatisfaction(course);
}

function setSatisfaction(course) {
    if (typeof course.selectedLectureTimes !== "undefined") {
        $.each(course.selectedLectureTimes, function (i, time) {
            $(time).attr("satisfied", course.satisfied);
        });
        $(course.selectedLecture).attr("satisfied", course.satisfied);
    }

    if (typeof course.selectedTutorialTimes !== "undefined") {
        $.each(course.selectedTutorialTimes, function (i, time) {
            $(time).attr("satisfied", course.satisfied);
        });
        $(course.selectedTutorial).attr("satisfied", course.satisfied);
    }
}