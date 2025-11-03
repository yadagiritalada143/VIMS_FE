import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReorderModalComponent } from './reorder-modal.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ReorderModalComponent', () => {
  let component: ReorderModalComponent;
  let fixture: ComponentFixture<ReorderModalComponent>;
  CommonTestingModule.setUpTestBed(ReorderModalComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ReorderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
