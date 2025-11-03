import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ReplaceApproverComponent } from './replace-approver.component';

describe('ReplaceApproverComponent', () => {
  let component: ReplaceApproverComponent;
  let fixture: ComponentFixture<ReplaceApproverComponent>;
  CommonTestingModule.setUpTestBed(ReplaceApproverComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReplaceApproverComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplaceApproverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
