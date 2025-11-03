import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomFieldViewComponent } from './custom-field-view.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { DatePipe } from '@angular/common';

describe('CustomFieldViewComponent', () => {
  let component: CustomFieldViewComponent;
  let fixture: ComponentFixture<CustomFieldViewComponent>;
  CommonTestingModule.setUpTestBed(CustomFieldViewComponent);
  let date: Partial<DatePipe>;

  beforeEach(async(() => {
    const datePipe = jasmine.createSpyObj('DatePipe',['transform']);
    TestBed.configureTestingModule({
      declarations: [ CustomFieldViewComponent ],
      providers:[
        { provide: DatePipe, useValue:  datePipe},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFieldViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
