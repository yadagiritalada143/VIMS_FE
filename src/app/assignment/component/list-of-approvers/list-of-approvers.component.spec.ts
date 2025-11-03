import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ListOfApproversComponent } from './list-of-approvers.component';

describe('ListOfApproversComponent', () => {
  let component: ListOfApproversComponent;
  let fixture: ComponentFixture<ListOfApproversComponent>;
  CommonTestingModule.setUpTestBed(ListOfApproversComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListOfApproversComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListOfApproversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
