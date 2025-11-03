import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistsComponent } from './checklists.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ChecklistsComponent', () => {
  let component: ChecklistsComponent;
  let fixture: ComponentFixture<ChecklistsComponent>;
  CommonTestingModule.setUpTestBed(ChecklistsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ChecklistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
