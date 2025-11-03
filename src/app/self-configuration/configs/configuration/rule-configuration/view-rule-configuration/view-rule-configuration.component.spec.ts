import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewRuleConfigurationComponent } from './view-rule-configuration.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { DatePipe } from '@angular/common';

describe('ViewRuleConfigurationComponent', () => {
  let component: ViewRuleConfigurationComponent;
  let fixture: ComponentFixture<ViewRuleConfigurationComponent>;
  CommonTestingModule.setUpTestBed(ViewRuleConfigurationComponent);
  let Date: Partial<DatePipe>;

  beforeEach(async () => {
    const datePipe = jasmine.createSpyObj('DatePipe',['transform']);
    await TestBed.configureTestingModule({
      declarations: [ ViewRuleConfigurationComponent ],
      providers:[
        { provide: DatePipe, useValue: datePipe}
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewRuleConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
