# Participant 1 - Feedback

Last Updated: 03/21/2024

- I'm on Windows 11
- Using node v20.11.1 and npm 10.2.4
- Using VS Code


## Building the widgets

- Everything works in Chrome
- Everything except the Range Slider works in Firefox; see [./logs/](./logs/)
  - Oddly it does not give any errors
  - You can click on it and it looks like the interactions are being logged, but you cannot actually move the sliders, it just stays fixed to default I think?
- I got a weird error everytime I visit the page even after a hard refresh
  - See [./logs/errors-on-initial-launch.png](./logs/errors-on-initial-launch.png) and [./logs/errors-on-initial-launch.log](./logs/errors-on-initial-launch.log)
- Added filtering to the dropdown widgets for the axes
- Having trouble getting dropdowns to update when I update the `[(select)]` directive
  - Oops, I was setting the variable to a string when the `[options]` directive used a list of objects, so I had to set the variable to an object not the optionLabel field string!
- Tried adding templates to the dropdown menus to get custom list items
  - Followed the example here: <https://www.primefaces.org/primeng-v15-lts/dropdown#template>
  - It did not work :( nothing appeared. Maybe you guys overwrite the way the items are drawn? Which would make sense given the widgets...
- I'm having difficulty figuring out what event to listen to when a dropdown changes...
  - I figured it out! It's `(selectedChanged)`
  - The documentation was confusing me. It states that `[(selected)]` is syntactic sugar binding the directive `[selected]` and event `(selectedChanged)`. When I want to manually do something when `selectedChanged` is fired I need to bind to that event specifically. It's obvious now but tripped me up for a bit.
  - See: <https://angular.io/guide/event-binding>
- It would be nice if the event in the callback for `(selectedChanged)` included the triggered element's `id` or something
  - I ended up using 2 params to the callback function with a manual string to label the element that triggered the `(selectedChanged)`
- Having trouble figuring out how to programmatically change the slider options and update the widget
  - I figured it out: <https://angular-slider.github.io/ngx-slider/demos#dynamic-options-slider>

## Using the widgets

- Clicking on the same place in the slider counts as an interaction. That's not what I expected. I expected the interaction to only count if the value of the slider changes
  - For example, when you click on the same item in the dropdown it doesn't not count as an interaction. This is what I expect to happen when the slider does not change value.
- I encounterd a bug where if you resize your browser window, you get a TON of errors about resizing the widgets
  - See [./logs/error-when-resizing-browser-window-widgets-complain.png](./logs/error-when-resizing-browser-window-widgets-complain.png)
- When selecting the attribute `Generation` in the dropdowns, the range slider takes like 20 seconds to update. This doesn't happen for any other attribute. It's very weird :O
