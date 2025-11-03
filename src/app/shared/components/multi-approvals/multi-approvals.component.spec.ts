import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MultiApprovalsComponent } from './multi-approvals.component';

describe('MultiApprovalsComponent', () => {
  let component: MultiApprovalsComponent;
  let fixture: ComponentFixture<MultiApprovalsComponent>;
  CommonTestingModule.setUpTestBed(MultiApprovalsComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultiApprovalsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
