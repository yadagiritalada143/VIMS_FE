import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectorModalComponent } from './selector-modal.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SelectorModalComponent', () => {
  let component: SelectorModalComponent;
  let fixture: ComponentFixture<SelectorModalComponent>;
  CommonTestingModule.setUpTestBed(SelectorModalComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
