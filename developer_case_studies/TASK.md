## Your Task

Hi there, are you a Pokemon fan? If yes, you will absolutely enjoy this! If not, we are hopeful you will at least learn something (and maybe become a fan)!

You will work with a [dataset on 802 Pokemon](./starter_code/angular_starter_code/src/assets/pokemon.csv) from all Seven Generations of Pokemon. The information contained in this dataset includes Base Stats, Height, Weight, Classification, etc. The information was scraped from http://serebii.net/.

### Data Dictionary
| Field            | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| Pokedex Number   | The entry number of the Pokemon in the National Pokedex                     |
| Name             | The English name of the Pokemon                                            |
| Classification   | The Classification of the Pokemon as described by the Sun and Moon Pokedex   |
| Primary Type     | The Primary Type of the Pokemon                                             |
| Secondary Type   | The Secondary Type of the Pokemon (e.g., poison)                            |
| Generation       | The numbered generation in which the Pokemon was first introduced           |
| Is Legendary     | Denotes if the Pokemon is legendary. 0=not, 1=yes                          |
| Height_m         | Height of the Pokemon in meters                                             |
| Weight_kg        | The Weight of the Pokemon in kilograms                                      |
| HP               | The Base HP of the Pokemon                                                  |
| Speed            | The Base Speed of the Pokemon                                               |
| Attack           | The Base Attack of the Pokemon                                              |
| Special Attack   | The Base Special Attack of the Pokemon                                      |
| Defense          | The Base Defense of the Pokemon                                             |
| Special Defense  | The Base Special Defense of the Pokemon                                     |
| Happiness        | Base Happiness of the Pokemon                                               |


### Dataset Preview
| Pokedex Number | Name       | Classification | Primary Type | Secondary Type | Generation | Is Legendary | Height_m | Weight_kg | HP  | Speed | Attack | Special Attack | Defense | Special Defense | Happiness |
|----------------|------------|----------------|--------------|----------------|------------|--------------|----------|------------|-----|-------|--------|----------------|---------|-----------------|-----------|
| 1              | Bulbasaur  | Seed Pokemon   | grass        | poison         | 1          | 0            | 0.7      | 6.9        | 45  | 45    | 49     | 65             | 49      | 65              | 70        |
| 2              | Ivysaur    | Seed Pokemon   | grass        | poison         | 1          | 0            | 1        | 13         | 60  | 60    | 62     | 80             | 63      | 80              | 70        |
| 3              | Venusaur   | Seed Pokemon   | grass        | poison         | 1          | 0            | 2        | 100        | 80  | 80    | 100    | 122            | 123     | 120             | 70        |
| 4              | Charmander | Lizard Pokemon| fire         |                | 1          | 0            | 0.6      | 8.5        | 39  | 65    | 52     | 60             | 43      | 50              | 70        |
| 5              | Charmeleon | Flame Pokemon | fire         |                | 1          | 0            | 1.1      | 19         | 58  | 80    | 64     | 80             | 58      | 65              | 70        |


### What You Have to Do.
0. You will be making a Pokemon Explorer for the Pokemon Fan Club! The fans would love to visually explore the Pokemon based on their name and stats. They may, hypothetically, select their dream team for a duel with one another! 
1. Essentially, your task is to make a visualization system consisting of a visualization and a control panel. 
    - By visualization, we mean a visual representation of (a subset of) the above dataset. Feel free to use any visualization library that you are comfortable with (e.g., D3.js, Vega-Lite) but ensure that you can get it to work with this codebase.
    - By control panel, we mean a panel with a bunch of control UI elements such as single/range sliders, single/multiselect dropdowns, radiobuttons, checkboxes, input text, etc.
    - Completely up to you how you want to position these elements relative to each other, i.e., the controls may or may not necessarily be in a conventionally separate panel.
2. Note that for the control panel UI elements, you will _have to_ use ProvenanceWidgets. Some ideas on how you could utilize them:
    - As Visualization specification elements, e.g., visual encodings such as x, y, color, etc, or filter or sort.
    - As Visualization beautification elements, e.g., adjusting the font size, color, etc.
    - Any other use-case that you seem apt.
3. The ProvenanceWidgets:
    - Should update the chart accordingly when interacted with, obviously, e.g., if I lookup a certain Pokemon by name, the visualization could filter/highlight that Pokemon.
    - Should track and visualize provenance (which is what they're built to do). The specifics are up to you, e.g., if you want them to update per interaction vs. based on time.
    - All of this, because, your Pokemon Fan Club client wishes to track fans' exploration criteria/behavior/strategy.
4. ...Enjoy!


### Housekeeping
5. Fork the repository and add us (arpitnarechania and kausko) as collaborators. This will help us assist you with problems/issues that you may encounter.
6. Keep committing your changes often. We don't want you to lose your progress.
7. As you are working with the ProvenanceWidgets and this starter-app, please keep noting down any kind of feedback that you feel can help us improve the library. It could be bugs, feature requests, happy moments, enhancements, anything. You can keep noting these inside [FEEDBACK.md](./starter_code/angular_starter_code/FEEDBACK.md).
8. Once you feel that you have accomplished the task, email us, and we will schedule the final 25-minute interview wherein we will go through your developed application and also your feedback.


### Bonus
9. Primarily, your task above is to establish a one-way communication from the widgets to the visualization, i.e., interact with the widgets (e.g., filter) and accordingly update the visualization. The bonus task involves establishing a two-way communication between the widgets and the visualization.
10. For example:
    - Widget to Vis: When I use a range slider to filter for a specific range (e.g., Height < 1), the visualization should update (obviously) and so should the visual provenance scents on the widgets (e.g., the Height range slider should show that I've filtered for Height < 1m). You are doing this for the above task any way.
    - Vis to Widget: In this additional bonus configuration, any data point (pokemon) you interact with in the visualization (e.g., you hovered on a pokemon OR you brushed for a range of pokemons), the widgets should also update to reflect this operation. For instance, if Height is encoded on the X axis and if I apply a rectangular brush to highlight pokemons with Height between [0.4, 0.8], then the corresponding Height range slider should also update to show this (almost simulating the brushing event as if occurred due to the widget interaction as opposed to visualization interaction). To achieve this, you will have to manually update the `[(provenance)]` model (`data` property in particular) and pass an additional `revalidate:true` property. Refer to the documentation on more details.

### Need Help? Contact Us without Hesitation.
Email Arpit Narechania (arpitnarechania@gatech.edu) and Kaustubh Odak (kodak@gatech.edu).
