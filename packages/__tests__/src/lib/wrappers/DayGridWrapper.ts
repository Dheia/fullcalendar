import { findElements } from '@fullcalendar/core'
import { formatIsoDay } from '../datelib-utils'
import { getRectCenter, intersectRects, addPoints, subtractPoints } from '../geom'
import CalendarWrapper from './CalendarWrapper'

export default class DayGridWrapper {

  static EVENT_IS_START_CLASSNAME = 'fc-start'
  static EVENT_IS_END_CLASSNAME = 'fc-end'
  static MORE_LINK_CLASSNAME = 'fc-more'


  constructor(private el: HTMLElement) {
  }


  getAllDayEls() {
    return findElements(this.el, '.fc-day[data-date]')
  }


  getDayEl(date) {
    if (typeof date === 'string') {
      date = new Date(date)
    }
    return this.el.querySelector('.fc-day[data-date="' + formatIsoDay(date) + '"]')
  }


  getDayEls(date) { // TODO: return single el??? accept 'tues'
    if (typeof date === 'number') {
      return findElements(this.el, `.fc-day.${CalendarWrapper.DOW_CLASSNAMES[date]}`)
    } else {
      if (typeof date === 'string') {
        date = new Date(date)
      }
      return findElements(this.el, '.fc-day[data-date="' + formatIsoDay(date) + '"]')
    }
  }


  getDayNumberText(date) {
    if (typeof date === 'string') {
      date = new Date(date)
    }
    return $('.fc-day-top[data-date="' + formatIsoDay(date) + '"]', this.el).text()
  }


  getDayElsInRow(row) {
    return findElements(this.getRowEl(row), '.fc-day')
  }


  // TODO: discourage use
  getNonBusinessDayEls() {
    return findElements(this.el, '.fc-nonbusiness')
  }


  // TODO: discourage use
  getDowEls(dayAbbrev) {
    return findElements(this.el, `.fc-row:first-child td.fc-day.fc-${dayAbbrev}`)
  }


  getDisabledDayEls() {
    return findElements(this.el, '.fc-bg .fc-disabled-day')
  }


  getAxisEls() {
    return findElements(this.el, '.fc-axis')
  }


  getMoreEl() {
    return this.el.querySelector('.fc-more')
  }


  getMoreEls() {
    return findElements(this.el, '.fc-more')
  }


  getWeekNavLinkEls(isEmbedded) { // along the sides of the row
    return isEmbedded
      ? findElements(this.el, '.fc-day-top a.fc-week-number')
      : findElements(this.el, '.fc-week-number a')
  }


  getWeekCell(rowIndex) {
    return this.el.querySelector(`.fc-row:nth-child(${rowIndex + 1}) td.fc-week-number`)
  }


  getWeekNumberText(rowIndex) {
    return $(this.el.querySelector(`.fc-row:nth-child(${rowIndex + 1}) .fc-content-skeleton thead td.fc-week-number`)).text()
  }


  getNavLinkEl(date) {
    if (typeof date === 'string') {
      date = new Date(date)
    }
    return this.el.querySelector(`.fc-day-top[data-date="${formatIsoDay(date)}"] a:not(.fc-week-number)`)
  }


  clickNavLink(date) {
    $.simulateMouseClick(this.getNavLinkEl(date))
  }


  openMorePopover(index?) {
    if (index == null) {
      $(this.getMoreEl()).simulate('click')
    } else {
      $(this.el.querySelectorAll('.fc-more')[index]).simulate('click')
    }
  }


  getMorePopoverEl() {
    return this.el.parentNode.querySelector('.fc-more-popover') as HTMLElement // popover lives as a sibling
  }


  getMorePopoverHeaderEl() {
    return this.getMorePopoverEl().querySelector('.fc-header') as HTMLElement
  }


  getMorePopoverEventEls() {
    return findElements(this.getMorePopoverEl(), '.fc-event')
  }


  getMorePopoverEventCnt() { // fg
    return this.getMorePopoverEventEls().length
  }


  getMorePopoverEventTitles() {
    return this.getMorePopoverEventEls().map((el) => {
      return $(el.querySelector('.fc-title')).text()
    })
  }


  getMorePopoverBgEventCnt() {
    return this.getMorePopoverEl().querySelectorAll('.fc-bgevent').length
  }


  closeMorePopover() {
    $(this.getMorePopoverEl().querySelector('.fc-close')).simulate('click')
  }


  getMorePopoverTitle() {
    return $(this.getMorePopoverEl().querySelector('.fc-header .fc-title')).text()
  }


  getRowEl(i) {
    return this.el.querySelector(`.fc-row:nth-child(${i + 1})`) as HTMLElement // nth-child is 1-indexed!
  }


  getRowEls() {
    return findElements(this.el, '.fc-row')
  }


  getBgEventEls(row?) {
    let parentEl = row == null ? this.el : this.getRowEl(row)
    return findElements(parentEl, '.fc-bgevent')
  }


  getEventEls() { // FG events
    return findElements(this.el, '.fc-event')
  }


  getFirstEventEl() {
    return this.el.querySelector('.fc-event') as HTMLElement
  }


  getHighlightEls() { // FG events
    return findElements(this.el, '.fc-highlight')
  }


  clickDate(date) {
    $.simulateMouseClick(this.getDayEl(date))
  }


  selectDates(start, inclusiveEnd) {
    return new Promise((resolve) => {
      $(this.getDayEls(start)).simulate('drag', {
        point: getRectCenter(this.getDayEl(start).getBoundingClientRect()),
        end: getRectCenter(this.getDayEl(inclusiveEnd).getBoundingClientRect()),
        onRelease: () => resolve()
      })
    })
  }


  selectDatesTouch(start, inclusiveEnd) {
    return new Promise((resolve) => {
      let startEl = this.getDayEl(start)

      setTimeout(() => { // wait for calendar to accept touch :(
        // QUESTION: why do we not need to do press-down first?
        $(startEl).simulate('drag', {
          isTouch: true,
          end: getRectCenter(this.getDayEl(inclusiveEnd).getBoundingClientRect()),
          onRelease: () => resolve()
        })
      }, 0)
    })
  }


  dragEventToDate(eventEl: HTMLElement, startDate, endDate, isTouch?) {
    return new Promise((resolve) => {
      if (!startDate) {
        let rect1 = this.getDayEl(endDate).getBoundingClientRect()
        let point1 = getRectCenter(rect1)

        $(eventEl).simulate('drag', {
          isTouch: isTouch || false,
          delay: isTouch ? 200 : 0, // bad to hardcode ms
          end: point1,
          onRelease: () => resolve()
        })
      } else {
        let rect0 = this.getDayEl(startDate).getBoundingClientRect()
        let rect1 = this.getDayEl(endDate).getBoundingClientRect()

        let eventRect = eventEl.getBoundingClientRect()
        let point0 = getRectCenter(intersectRects(eventRect, rect0))
        let point1 = getRectCenter(rect1)

        $(eventEl).simulate('drag', {
          isTouch: isTouch || false,
          delay: isTouch ? 200 : 0, // bad to hardcode ms
          point: point0,
          end: point1,
          onRelease: () => resolve()
        })
      }
    })
  }


  resizeEvent(eventEl: HTMLElement, origEndDate, newEndDate, fromStart?) {
    return new Promise((resolve) => {
      let rect0 = this.getDayEl(origEndDate).getBoundingClientRect()
      let rect1 = this.getDayEl(newEndDate).getBoundingClientRect()

      $(eventEl).simulate('mouseover') // so that resize handle is revealed

      var resizerEl = eventEl.querySelector(
        '.' + (fromStart ? CalendarWrapper.EVENT_START_RESIZER_CLASSNAME : CalendarWrapper.EVENT_END_RESIZER_CLASSNAME)
      )
      var resizerRect = resizerEl.getBoundingClientRect()
      var resizerCenter = getRectCenter(resizerRect)

      var vector = subtractPoints(resizerCenter, rect0)
      var endPoint = addPoints(rect1, vector)

      $(resizerEl).simulate('drag', {
        point: resizerCenter,
        end: endPoint,
        onRelease: () => resolve()
      })
    })
  }


  resizeEventTouch(eventEl: HTMLElement, origEndDate, newEndDate, fromStart?) {
    return new Promise((resolve) => {
      let rect0 = this.getDayEl(origEndDate).getBoundingClientRect()
      let rect1 = this.getDayEl(newEndDate).getBoundingClientRect()

      setTimeout(() => { // wait for calendar to accept touch :(
        $(eventEl).simulate('drag', {
          isTouch: true,
          delay: 200,
          onRelease: () => {
            var resizerEl = eventEl.querySelector(
              '.' + (fromStart ? CalendarWrapper.EVENT_START_RESIZER_CLASSNAME : CalendarWrapper.EVENT_END_RESIZER_CLASSNAME)
            )
            var resizerRect = resizerEl.getBoundingClientRect()
            var resizerCenter = getRectCenter(resizerRect)

            var vector = subtractPoints(resizerCenter, rect0)
            var endPoint = addPoints(rect1, vector)

            $(resizerEl).simulate('drag', {
              isTouch: true,
              point: resizerCenter,
              end: endPoint,
              onRelease: () => resolve()
            })
          }
        })
      }, 0)
    })
  }

}


export function getLegacyWeekNumberCounts() {
  return {
    allWeekNumbers: $('.fc-week-number').length,
    colWeekNumbers: $('.fc-content-skeleton thead td.fc-week-number').length,
    cellWeekNumbers: $('.fc-content-skeleton thead .fc-day-top span.fc-week-number').length, // within-the-cell
    cornerWeekNumbers: $('.fc-head .fc-axis.fc-week-number').length
  }
}