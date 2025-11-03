import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImpactedAssignmentDetailsComponent } from './impacted-assignment-details.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { DatePipe } from '@angular/common';

describe('ImpactedAssignmentDetailsComponent', () => {
  let component: ImpactedAssignmentDetailsComponent;
  let fixture: ComponentFixture<ImpactedAssignmentDetailsComponent>;
  CommonTestingModule.setUpTestBed(ImpactedAssignmentDetailsComponent);
  let Date: Partial<DatePipe>;

  beforeEach(async () => {
    const datePipe = jasmine.createSpyObj('DatePipe',['transform']);
    await TestBed.configureTestingModule({
      declarations: [ ImpactedAssignmentDetailsComponent ],
      providers:[
        { provide: DatePipe, useValue: datePipe}
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpactedAssignmentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
