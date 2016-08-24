description: 'Declare salary.',

steps: [
    ResourcesComponent.declareRevenuActivite(),
    ResourcesComponent.hasSalary(),
    ResourcesComponent.submit(),
    ResourcesComponent.setFirstMonthInput(1000),
    ResourcesComponent.setSecondMonthInput(1000),
    ResourcesComponent.setThirdMonthInput(1000),
    ResourcesComponent.setLast12MonthsInput(12000),
    ResourcesComponent.submit(),
    {
        'RecapComponent.revenue': /Salaire/,
    },
]