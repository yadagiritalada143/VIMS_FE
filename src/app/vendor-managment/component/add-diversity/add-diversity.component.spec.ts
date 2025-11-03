import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddDiversityComponent } from './add-diversity.component';

describe('AddDiversityComponent', () => {
  let component: AddDiversityComponent;
  let fixture: ComponentFixture<AddDiversityComponent>;
  CommonTestingModule.setUpTestBed(AddDiversityComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddDiversityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDiversityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
