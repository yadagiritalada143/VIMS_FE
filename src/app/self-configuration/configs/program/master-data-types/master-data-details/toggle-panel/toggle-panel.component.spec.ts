import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TogglePanelComponent } from './toggle-panel.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('TogglePanelComponent', () => {
  let component: TogglePanelComponent;
  let fixture: ComponentFixture<TogglePanelComponent>;
  CommonTestingModule.setUpTestBed(TogglePanelComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TogglePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
