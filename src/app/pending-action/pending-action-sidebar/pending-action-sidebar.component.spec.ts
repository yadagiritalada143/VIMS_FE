import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { PendingActionSidebarComponent } from './pending-action-sidebar.component';

describe('PendingActionSidebarComponent', () => {
  let component: PendingActionSidebarComponent;
  let fixture: ComponentFixture<PendingActionSidebarComponent>;
  CommonTestingModule.setUpTestBed(PendingActionSidebarComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingActionSidebarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingActionSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
