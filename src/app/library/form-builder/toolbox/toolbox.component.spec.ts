import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToolboxComponent } from './toolbox.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ToolboxComponent', () => {
  let component: ToolboxComponent;
  let fixture: ComponentFixture<ToolboxComponent>;
  CommonTestingModule.setUpTestBed(ToolboxComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
